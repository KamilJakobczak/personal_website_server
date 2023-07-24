import {
  CoverType,
  Currency,
  Edition,
  Prisma,
  Status,
  UserBookDetails,
} from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../prismaClient';

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
    deleteUserBookDetails(id: ID!): UserBookDetailsPayload!
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
      // if (!id && !bookId) {
      //   return {
      //     userErrors: [{ message: 'Provide a valid id' }],
      //     userBookDetails: null,
      //   };
      // }

      const { user } = req.session;

      if (user) {
        const { profileId } = user;
        const profile = await prisma.profile.findUnique({
          where: {
            id: profileId,
          },
        });
        if (profile) {
          const record = await prisma.userBookDetails.findFirst({
            where: {
              bookID: bookId,
              profileID: profileId,
            },
          });
          if (record) {
            console.log(record);
            return {
              userErrors: [{ message: '' }],
              userBookDetails: record,
            };
          } else
            return {
              userErrors: [{ message: '' }],
              userBookDetails: null,
            };
        }
      }
      return {
        userErrors: [{ message: 'User not logged in' }],
        userBookDetails: null,
      };

      // return {
      //   userErrors: [{ message: '' }],
      //   userBookDetails: await prisma.userBookDetails.findUnique({
      //     where: {
      //       id,
      //     },
      //   }),
      // };
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
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          userBookDetails: null,
        };
      }
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
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          userBookDetails: null,
        };
      }
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
    ): Promise<UserBookDetailsPayloadType> => {
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          userBookDetails: null,
        };
      }
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

      return {
        userErrors: [{ message: '' }],
        userBookDetails: prisma.userBookDetails.delete({
          where: {
            id,
          },
        }),
      };
    },
  },
};
