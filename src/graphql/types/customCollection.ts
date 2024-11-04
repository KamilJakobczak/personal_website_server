import { gql } from 'apollo-server';
import { Context } from '../../bookCollection/prismaClient';

import { CustomCollection, Prisma } from '@prisma/client';

interface CustomCollectionPayloadType {
  userErrors: {
    message: string;
  }[];
  customCollection:
    | CustomCollection
    | Prisma.Prisma__CustomCollectionClient<CustomCollection>
    | null;
}

export const customCollection = gql`
  extend type Query {
    customCollection(id: ID!): CustomCollection!
    customCollections(profileId: String!): [CustomCollection]!
}

  type Mutation {
    createCollection(input: CreateCollectionInput!): CustomCollectionPayload!
    editCollection(): CustomCollectionPayload!
    removeCollection(id: ID!): CustomCollectionPayload!
  }

  type CustomCollection implements Node {
    id: ID!
    name: String!
    profile: Profile!
    books: [Book]
    public: Boolean
}

type CustomCollectionPayload {
  userErrors: [userError!]!
  customCollection: CustomCollection
}

type CreateCollectionInput {
  name: String!
  published: Boolean!
}


`;

export const customCollectionResolvers = {
  Query: {
    customCollection: (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.customCollection.findUnique({
        where: {
          id,
        },
      });
    },
    customCollections: (
      _: any,
      { profileId }: { profileId: string },
      { prisma }: Context
    ) => {
      return prisma.customCollection.findMany({
        where: {
          profileID: profileId,
        },
      });
    },
  },
  Collection: {
    books: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          customCollectionsIDs: {
            has: id,
          },
        },
      });
    },
  },
  Mutation: {
    addCustomCollection: async (
      _: any,
      { name, published }: { name: string; published: boolean },
      { prisma, req }: Context
    ): Promise<CustomCollectionPayloadType> => {
      if (!req?.session?.user) {
        return {
          userErrors: [{ message: 'Auth check failed' }],
          customCollection: null,
        };
      }
      const { profileId } = req.session.user;

      if (!profileId) {
        return {
          userErrors: [{ message: 'You are not logged in' }],
          customCollection: null,
        };
      }

      if (!name) {
        return {
          userErrors: [{ message: 'Provide a name for your collection' }],
          customCollection: null,
        };
      }
      const customCollection = prisma.customCollection.create({
        data: {
          name: name,
          profileID: profileId,
          published: published,
        },
      });
      return {
        userErrors: [{ message: '' }],
        customCollection: customCollection,
      };
    },
    deleteCustomCollection: async (
      _: any,
      { id }: { id: string },
      { prisma, req }: Context
    ): Promise<CustomCollectionPayloadType> => {
      if (!req?.session?.user) {
        return {
          userErrors: [{ message: 'Auth check failed' }],
          customCollection: null,
        };
      }
      const { profileId } = req.session.user;

      if (!profileId) {
        return {
          userErrors: [{ message: 'You are not logged in' }],
          customCollection: null,
        };
      }

      const customCollection = await prisma.customCollection.delete({
        where: { id: id },
      });

      return {
        userErrors: [{ message: '' }],
        customCollection: customCollection,
      };
    },
    updateCustomColletion: async (
      _: any,
      { id, bookId }: { id: string; bookId: string },
      { prisma, req }: Context
    ): Promise<CustomCollectionPayloadType> => {
      if (!req?.session?.user) {
        return {
          userErrors: [{ message: 'Auth check failed' }],
          customCollection: null,
        };
      }
      const { profileId } = req.session.user;

      if (!profileId) {
        return {
          userErrors: [{ message: 'You are not logged in' }],
          customCollection: null,
        };
      }
      const customCollection = await prisma.customCollection.findUnique({
        where: { id },
      });

      if (!customCollection) {
        return {
          userErrors: [{ message: "Collection doesn't exist" }],
          customCollection: null,
        };
      }
      const booksIDs = customCollection.booksIDs;
      let updatedBooksIDs;

      if (booksIDs.includes(bookId)) {
        const index = booksIDs.indexOf(bookId);
        updatedBooksIDs = booksIDs.splice(index, index);
      } else {
        updatedBooksIDs = [...booksIDs, bookId];
      }

      const updatedCustomCollection = await prisma.customCollection.update({
        where: { id },
        data: {
          booksIDs: updatedBooksIDs,
        },
      });

      return {
        userErrors: [{ message: '' }],
        customCollection: updatedCustomCollection,
      };
    },
  },
};
