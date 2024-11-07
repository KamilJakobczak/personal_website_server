import {
  CoverType,
  Currency,
  Edition,
  Prisma,
  Status,
  UserBookDetails,
} from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { assertSessionUser } from '../utils/typeGuards';
import { DeletePayloadType } from './resolvers/deleteResolver';

export const userBookDetails = gql`
  extend type Query {
    userBookDetails(bookId: ID!): UserBookDetailsPayload!
    userBooksDetails: [UserBookDetails!]!
  }
  type Mutation {
    addUserBookDetails(input: addUserBookDetailsInput!): UserBookDetailsPayload!
    updateUserBookDetails(
      id: ID!
      input: updateUserBookDetailsInput!
    ): UserBookDetailsPayload!
    deleteUserBookDetails(id: ID!): DeletePayload!
  }

  type UserBookDetails implements Node {
    id: ID!
    book: Book!
    profile: Profile!
    status: Status
    whenRead: Int
    rating: Int
    purchasedBookInfo: [PurchasedBookInfo]!
  }

  type PurchasedBookInfo {
    coverType: CoverType!
    edition: Edition
    buyPrice: Int
    currency: Currencies

  }
  # type CoverType {
  #   paperback: String
  #   hardcover: String
  #   ebook: String
  # }
  # input CoverTypeInput {
  #   paperback: String
  #   hardcover: String
  #   ebook: String
  # }

  type UserBookDetailsPayload {
    userErrors: [userError!]!
    userBookDetails: UserBookDetails
  }

  input bookDetailsInput {
    status: Status
    whenRead: Int
    rating: Int
    purchasedBookInfo: [purchasedBookInfoInput]
  }

  input purchasedBookInfoInput{
    coverType: CoverType!
    edition: editionInput
    buyPrice: Int
    currency: Currencies
  }
  
  input addUserBookDetailsInput {
    bookID: String!
    bookDetails: bookDetailsInput
  }
  input updateUserBookDetailsInput {
    bookDetails: bookDetailsInput
  }
  input editionInput {
    editionNumber: Int
    editionYear: Int
  }
  type Edition {
    editionNumber: Int
    editionYear: Int
  }
  enum CoverType {
    PAPERBACK
    HARDCOVER
    EBOOK
  }
  enum Currencies {
    USD
    PLN
    EUR
  }
  enum Status {
    READ
    UNREAD
    WANTEDTOBUY
    WANTEDTOREAD
  }
`;

interface UserBookDetailsArgs {
  input: {
    bookID: string;
    profileID: string;
    bookDetails: {
      status?: Status;
      whenRead?: number;
      rating?: number;
      purchasedBookInfo?: [
        {
          coverType: CoverType;
          edition?: Edition;
          buyPrice?: number;
          currency?: Currency;
        }
      ];
    };
  };
}
interface UserBookDetailsUpdateArgs {
  id: string;
  input: {
    bookDetails: {
      status?: Status;
      whenRead?: number;
      rating?: number;
      purchasedBookInfo?: [
        {
          coverType: CoverType;
          edition?: Edition;
          buyPrice?: number;
          currency?: Currency;
        }
      ];
    };
  };
}

interface UserBookDetailsPayloadType {
  userErrors: { message: string }[];
  userBookDetails:
    | UserBookDetails
    | Prisma.Prisma__UserBookDetailsClient<UserBookDetails>
    | null;
}

export const userBookDetailsResolvers = {
  Query: {
    userBookDetails: async (
      _: any,
      { bookId }: { bookId: string },
      { prisma, req }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      assertSessionUser(req);
      const { profileId } = req.session.user;

      const profile = await prisma.profile.findUnique({
        where: {
          id: profileId,
        },
      });

      if (!profile) {
        return {
          userErrors: [{ message: 'Profile not found' }],
          userBookDetails: null,
        };
      }
      const record = await prisma.userBookDetails.findFirst({
        where: {
          bookID: bookId,
          profileID: profileId,
        },
      });

      if (!record) {
        return {
          userErrors: [{ message: 'Details not found' }],
          userBookDetails: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        userBookDetails: record,
      };
    },
  },
  UserBookDetails: {
    book: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      const userBookDetails = await prisma.userBookDetails.findUnique({
        where: { id },
      });
      if (!userBookDetails) {
        return 'Error';
      }
      const { bookID } = userBookDetails;
      return prisma.book.findUnique({
        where: {
          id: bookID,
        },
      });
    },
  },
  Mutation: {
    addUserBookDetails: async (
      _: any,
      { input }: UserBookDetailsArgs,
      { prisma, req }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      assertSessionUser(req);
      const { bookID, bookDetails } = input;
      const { profileId } = req.session.user;
      const recordExists = await prisma.userBookDetails.findFirst({
        where: {
          profileID: profileId,
          bookID,
        },
      });
      if (recordExists) {
        return {
          userErrors: [{ message: 'Record already created' }],
          userBookDetails: recordExists,
        };
      }

      const { status, rating, whenRead, purchasedBookInfo } = bookDetails;

      return {
        userErrors: [{ message: '' }],
        userBookDetails: prisma.userBookDetails.create({
          data: {
            profileID: profileId,
            bookID,
            status,
            whenRead,
            rating,
            purchasedBookInfo,
          },
        }),
      };
    },
    updateUserBookDetails: async (
      _: any,
      { id, input }: UserBookDetailsUpdateArgs,
      { prisma, req }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      assertSessionUser(req);
      const userBookDetailsRecord = await prisma.userBookDetails.findUnique({
        where: {
          id,
        },
      });
      if (!userBookDetailsRecord) {
        return {
          userErrors: [
            { message: 'You are trying to update non exisiting record' },
          ],
          userBookDetails: null,
        };
      }

      if (userBookDetailsRecord.profileID !== req.session.user.profileId) {
        return {
          userErrors: [{ message: 'Log in to YOUR account' }],
          userBookDetails: null,
        };
      }
      const { bookDetails } = input;
      const { status, rating, whenRead, purchasedBookInfo } = bookDetails;

      let payloadToUpdate = {
        status,
        rating,
        whenRead,
        purchasedBookInfo,
      };

      if (!status) {
        delete payloadToUpdate.status;
      }
      if (!rating) {
        delete payloadToUpdate.rating;
      }
      if (!whenRead) {
        delete payloadToUpdate.whenRead;
      }
      if (!purchasedBookInfo) {
        delete payloadToUpdate.purchasedBookInfo;
      }

      return {
        userErrors: [{ message: '' }],
        userBookDetails: prisma.userBookDetails.update({
          where: {
            id,
          },
          data: {
            ...payloadToUpdate,
          },
        }),
      };
    },
    deleteUserBookDetails: async (
      _: any,
      { id }: { id: string },
      { prisma, req }: Context
    ): Promise<DeletePayloadType> => {
      // Ensure the user is authenticated
      assertSessionUser(req);

      try {
        const userBookDetails = await prisma.userBookDetails.findUniqueOrThrow({
          where: {
            id,
          },
        });
        if (userBookDetails.profileID !== req.session.user.profileId) {
          throw new Error("You can't delete details that are not yours");
        }
        await prisma.userBookDetails.delete({ where: { id } });

        return {
          userErrors: [{ message: '' }],
          success: true,
        };
      } catch (error: any) {
        console.error('Error deleting your book details', error);
        return {
          userErrors: [{ message: `${error.message}` }],
          success: false,
        };
      }
    },
  },
};
