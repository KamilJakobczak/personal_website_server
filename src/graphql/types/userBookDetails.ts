import {
  CoverType,
  Currency,
  Prisma,
  Status,
  UserBookDetails,
} from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../prismaClient';

export const userBookDetails = gql`
  extend type Query {
    userBookDetails(id: ID, bookId: ID): UserBookDetailsPayload!
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
    editions: Editions
    status: Status
    coverType: CoverType
    whenRead: Int
    currency: Currencies
    buyPrice: Float
    rating: Int
  }

  type CoverType {
    paperback: String
    hardcover: String
    ebook: String
  }
  input CoverTypeInput {
    paperback: String
    hardcover: String
    ebook: String
  }

  type UserBookDetailsPayload {
    userErrors: [userError!]!
    userBookDetails: UserBookDetails
  }
  input bookDetails {
    editions: editionsInput
    status: Status
    coverType: CoverTypeInput
    whenRead: Int
    currency: Currencies
    buyPrice: Float
    rating: Int
  }

  input addUserBookDetailsInput {
    bookID: String!
    bookDetails: bookDetails
  }
  input updateUserBookDetailsInput {
    bookDetails: bookDetails
  }
  input editionsInput {
    myEditionNumber: Int
    myEditionYear: Int
  }
  type Editions {
    myEditionNumber: Int
    myEditionYear: Int
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
      editions?: {
        myEditionNumber: number;
        myEditionYear: number;
      };
      coverType?: CoverType;
      status?: Status;
      whenRead?: number;
      currency?: Currency;
      buyPrice?: number;
      rating?: number;
    };
  };
}
interface UserBookDetailsUpdateArgs {
  id: string;
  input: {
    bookDetails: {
      editions?: {
        myEditionNumber: number;
        myEditionYear: number;
      };
      status?: Status;
      coverType?: CoverType;
      whenRead?: number;
      currency?: Currency;
      buyPrice?: number;
      rating?: number;
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
      { id, bookId }: { id: string; bookId: string },
      { prisma, userInfo }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      if (!id && !bookId) {
        return {
          userErrors: [{ message: 'Provide a valid id' }],
          userBookDetails: null,
        };
      }
      if (!id && userInfo) {
        const { profileId } = userInfo;
        const profile = await prisma.profile.findUnique({
          where: {
            id: profileId,
          },
        });
        return {
          userErrors: [{ message: '' }],
          userBookDetails: await prisma.userBookDetails.findFirst({
            where: {
              bookID: bookId,
              profileID: profileId,
            },
          }),
        };
      }
      return {
        userErrors: [{ message: '' }],
        userBookDetails: await prisma.userBookDetails.findUnique({
          where: {
            id,
          },
        }),
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
      { prisma, userInfo }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      if (!userInfo) {
        return {
          userErrors: [{ message: 'Log in first' }],
          userBookDetails: null,
        };
      }
      const { bookID, bookDetails } = input;
      const { profileId } = userInfo;
      const recordExists = await prisma.userBookDetails.findFirst({
        where: {
          profileID: profileId,
          bookID,
        },
      });
      if (recordExists) {
        return {
          userErrors: [{ message: 'Record was already created' }],
          userBookDetails: recordExists,
        };
      }

      const {
        status,
        editions,
        currency,
        rating,
        buyPrice,
        whenRead,
        coverType,
      } = bookDetails;

      return {
        userErrors: [{ message: '' }],
        userBookDetails: prisma.userBookDetails.create({
          data: {
            profileID: profileId,
            bookID,
            editions,
            currency,
            status,
            whenRead,
            buyPrice,
            rating,
            coverType,
          },
        }),
      };
    },
    updateUserBookDetails: async (
      _: any,
      { id, input }: UserBookDetailsUpdateArgs,
      { prisma, userInfo }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      if (!userInfo) {
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

      if (userBookDetailsRecord.profileID !== userInfo.profileId) {
        return {
          userErrors: [{ message: 'Log in to YOUR account' }],
          userBookDetails: null,
        };
      }
      const { bookDetails } = input;
      const {
        editions,
        currency,
        status,
        buyPrice,
        rating,
        whenRead,
        coverType,
      } = bookDetails;

      let payloadToUpdate = {
        editions,
        currency,
        status,
        buyPrice,
        rating,
        whenRead,
        coverType,
      };
      if (!buyPrice) {
        delete payloadToUpdate.buyPrice;
      }
      if (!currency) {
        delete payloadToUpdate.currency;
      }
      if (!editions) {
        delete payloadToUpdate.editions;
      }
      if (!status) {
        delete payloadToUpdate.status;
      }
      if (!rating) {
        delete payloadToUpdate.rating;
      }
      if (!whenRead) {
        delete payloadToUpdate.whenRead;
      }
      if (!coverType) {
        delete payloadToUpdate.coverType;
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
      { prisma, userInfo }: Context
    ): Promise<UserBookDetailsPayloadType> => {
      if (!userInfo) {
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

      if (userBookDetailsRecord.profileID !== userInfo.profileId) {
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
