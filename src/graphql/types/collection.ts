import { Collection, Prisma } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import { authCheck } from './resolvers/auth';

interface CollectionArgs {
  input: {
    name: string;
    booksInCollection: {
      tome: string;
      bookId: string;
    };
  };
}
interface CollectionUpdateArgs {
  id: string;
  input: {
    name: string;
    booksInCollection: {
      tome: string;
      bookId: string;
    };
  };
}
interface CollectionPayloadType {
  userErrors: {
    message: string;
  }[];
  collection: Collection | Prisma.Prisma__CollectionClient<Collection> | null;
}

export const collection = gql`
  extend type Query {
    collection(id: ID!): Collection
    collections: [Collection!]!
  }

  type Mutation {
    addCollection(input: addCollectionInput!): CollectionPayload!
    deleteCollection(id: ID!): CollectionPayload!
    updateCollection(id: ID!, input: updateCollectionInput!): CollectionPayload
  }

  type CollectionPayload {
    userErrors: [userError!]!
    collection: Collection
  }

  input addCollectionInput {
    name: String!
    booksInCollection: [BookInCollectionInput]
  }
  input updateCollectionInput {
    name: String
    booksInCollection: [BookInCollectionInput]
  }
  input BookInCollectionInput {
    tome: String!
    bookId: ID!
  }

  type Collection implements Node {
    id: ID!
    name: String!
    books: [Book!]!
    booksInCollection: [BookInCollection]!
  }
  type BookInCollection {
    tome: String
    bookId: String
  }
`;

export const collectionResolvers = {
  Query: {
    collection: (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.collection.findUnique({
        where: {
          id,
        },
      });
    },
    collections: (_: any, __: any, { prisma }: Context) => {
      return prisma.collection.findMany();
    },
  },
  Collection: {
    books: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          collectionIDs: {
            has: id,
          },
        },
      });
    },
  },
  Mutation: {
    addCollection: async (
      _: any,
      { input }: CollectionArgs,
      { req, prisma }: Context
    ): Promise<CollectionPayloadType> => {
      const collectionNull = { collection: null };
      const userAuth = await authCheck({ req, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          ...collectionNull,
        };
      }
      const { name, booksInCollection } = input;

      const doesExist = await prisma.collection.findFirst({
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
            { message: 'Collection already exists in the database' },
          ],
          collection: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        collection: prisma.collection.create({
          data: {
            name: name,
            booksInCollection,
          },
        }),
      };
    },
    deleteCollection: async (
      _: any,
      { id }: { id: string },
      { prisma, req }: Context
    ): Promise<CollectionPayloadType> => {
      const userAuth = await authCheck({ req, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          collection: null,
        };
      }
      const collectionExists = await prisma.collection.findUnique({
        where: {
          id,
        },
      });
      if (!collectionExists) {
        return {
          ...{
            userErrors: [
              { message: 'Collection does not exist in the database' },
            ],
            collection: null,
          },
        };
      }
      return {
        userErrors: [
          {
            message: '',
          },
        ],
        collection: prisma.collection.delete({
          where: {
            id,
          },
        }),
      };
    },
    updateCollection: async (
      _: any,
      { id, input }: CollectionUpdateArgs,
      { prisma, req }: Context
    ): Promise<CollectionPayloadType> => {
      const { name, booksInCollection } = input;
      const { tome, bookId } = booksInCollection;
      const userAuth = await authCheck({ req, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          collection: null,
        };
      }

      const collectionExists = prisma.collection.findUnique({
        where: {
          id,
        },
      });
      if (!collectionExists) {
        return {
          userErrors: [
            { message: 'collection of specified id does not exist' },
          ],
          collection: null,
        };
      }

      if (!name) {
        return {
          userErrors: [{ message: 'must provide a new name' }],
          collection: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        collection: prisma.collection.update({
          data: {
            name,
            booksInCollection: {
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
