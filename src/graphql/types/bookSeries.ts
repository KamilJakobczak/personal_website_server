import { BookSeries, Prisma } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';

interface BookSeriesArgs {
  input: {
    name: string;
    booksInBookSeries: {
      tome: string;
      bookId: string;
    };
  };
}
interface BookSeriesUpdateArgs {
  id: string;
  input: {
    name: string;
    booksInBookSeries: {
      tome: string;
      bookId: string;
    };
  };
}
interface BookSeriesPayloadType {
  userErrors: {
    message: string;
  }[];
  bookSeries: BookSeries | Prisma.Prisma__BookSeriesClient<BookSeries> | null;
}

export const bookSeries = gql`
  extend type Query {
    singleBookSeries(id: ID!): BookSeries
    bookSeries: [BookSeries!]!
  }

  type Mutation {
    addBookSeries(input: addBookSeriesInput!): BookSeriesPayload!
    deleteBookSeries(id: ID!): BookSeriesPayload!
    updateBookSeries(id: ID!, input: updateBookSeriesInput!): BookSeriesPayload
  }

  type BookSeriesPayload {
    userErrors: [userError!]!
    bookSeries: BookSeries
  }

  input addBookSeriesInput {
    name: String!
    booksInBookSeries: [BookInBookSeriesInput]
  }
  input updateBookSeriesInput {
    name: String
    booksInBookSeries: [BookInBookSeriesInput]
  }
  input BookInBookSeriesInput {
    tome: String!
    bookId: ID!
  }

  type BookSeries implements Node {
    id: ID!
    name: String!
    books: [Book!]!
    booksInBookSeries: [BookInBookSeries]!
  }
  type BookInBookSeries {
    tome: String
    bookId: String
  }
`;

export const bookSeriesResolvers = {
  Query: {
    singleBookSeries: (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.bookSeries.findUnique({
        where: {
          id,
        },
      });
    },
    bookSeries: (_: any, __: any, { prisma }: Context) => {
      return prisma.bookSeries.findMany();
    },
  },
  BookSeries: {
    books: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          bookSeriesIDs: {
            has: id,
          },
        },
      });
    },
  },
  Mutation: {
    addBookSeries: async (
      _: any,
      { input }: BookSeriesArgs,
      { req, prisma }: Context
    ): Promise<BookSeriesPayloadType> => {
      // const collectionNull = { bookSeries: null };
      console.log('ADDING BOOK SERIES');
      // const userAuth = await authCheck({ req, prisma });

      // if (userAuth !== true) {
      //   return {
      //     ...userAuth,
      //     ...{ bookSeries: null },
      //   };
      // }
      const { name, booksInBookSeries } = input;
      if (name === '') {
        return {
          userErrors: [{ message: 'Must provide a name' }],
          bookSeries: null,
        };
      }
      const doesExist = await prisma.bookSeries.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });
      if (doesExist) {
        return {
          userErrors: [
            { message: 'BookSeries already exists in the database' },
          ],
          bookSeries: null,
        };
      }
      console.log(booksInBookSeries);
      return {
        userErrors: [{ message: '' }],
        bookSeries: prisma.bookSeries.create({
          data: {
            name: name,
            booksInBookSeries,
          },
        }),
      };
    },
    deleteBookSeries: async (
      _: any,
      { id }: { id: string },
      { prisma, req }: Context
    ): Promise<BookSeriesPayloadType> => {
      // const userAuth = await authCheck({ req, prisma });
      // if (userAuth !== true) {
      //   return {
      //     ...userAuth,
      //     bookSeries: null,
      //   };
      // }
      const bookSeriesExists = await prisma.bookSeries.findUnique({
        where: {
          id,
        },
      });
      if (!bookSeriesExists) {
        return {
          ...{
            userErrors: [
              { message: 'BookSeries does not exist in the database' },
            ],
            bookSeries: null,
          },
        };
      }

      return {
        userErrors: [
          {
            message: '',
          },
        ],
        bookSeries: prisma.bookSeries.delete({
          where: {
            id,
          },
        }),
      };
    },
    updateBookSeries: async (
      _: any,
      { id, input }: BookSeriesUpdateArgs,
      { prisma, req }: Context
    ): Promise<BookSeriesPayloadType> => {
      const { name, booksInBookSeries } = input;
      const { tome, bookId } = booksInBookSeries;
      // const userAuth = await authCheck({ req, prisma });
      // if (userAuth !== true) {
      //   return {
      //     ...userAuth,
      //     bookSeries: null,
      //   };
      // }

      const bookSeriesExists = prisma.bookSeries.findUnique({
        where: {
          id,
        },
      });
      if (!bookSeriesExists) {
        return {
          userErrors: [
            { message: 'book series of specified id does not exist' },
          ],
          bookSeries: null,
        };
      }

      if (!name) {
        return {
          userErrors: [{ message: 'must provide a new name' }],
          bookSeries: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        bookSeries: prisma.bookSeries.update({
          data: {
            name,
            booksInBookSeries: {
              tome,
              bookId,
            },
          },
          where: {
            id,
          },
        }),
      };
    },
  },
};
