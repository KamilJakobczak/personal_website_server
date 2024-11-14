import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';

import { CustomCollection, Prisma } from '@prisma/client';
import { assertSessionUser } from '../utils/typeGuards';
import { DeletePayloadType } from './resolvers/deleteResolver';

interface CustomCollectionPayloadType {
  userErrors: {
    message: string;
  }[];
  customCollection: CustomCollection | Prisma.Prisma__CustomCollectionClient<CustomCollection> | null;
}

export const customCollection = gql`
  extend type Query {
    customCollection(id: ID!): CustomCollection!
    customCollections(profileId: String!): [CustomCollection]!
}

  type Mutation {
    createCustomCollection(input: CreateCollectionInput!): CustomCollectionPayload!
    deleteCustomCollection(id: ID!): DeletePayload!
    updateCustomCollection(): CustomCollectionPayload!
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
    customCollections: (_: any, { profileId }: { profileId: string }, { prisma }: Context) => {
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
      assertSessionUser(req);
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
    ): Promise<DeletePayloadType> => {
      // Ensure the user is authenticated
      assertSessionUser(req);
      const { profileId } = req.session.user;

      try {
        const customCollection = await prisma.customCollection.findUniqueOrThrow({
          where: { id },
        });
        if (customCollection.profileID !== profileId) {
          throw new Error('You are not authorized to edit this collection');
        }
        const deletedCollection = prisma.customCollection.delete({
          where: { id },
        });
        console.log('Deleted custom collection:', deletedCollection);
        return {
          userErrors: [{ message: '' }],
          success: true,
        };
      } catch (error: any) {
        console.error('Error deleting custom collection', error);
        return {
          userErrors: [{ message: `${error.message}` }],
          success: false,
        };
      }
    },
    updateCustomColletion: async (
      _: any,
      { id, bookId }: { id: string; bookId: string },
      { prisma, req }: Context
    ): Promise<CustomCollectionPayloadType> => {
      assertSessionUser(req);
      const { profileId } = req.session.user;
      const customCollection = await prisma.customCollection.findUnique({
        where: { id },
      });

      if (!customCollection) {
        return {
          userErrors: [{ message: "Collection doesn't exist" }],
          customCollection: null,
        };
      }
      if (profileId !== customCollection.profileID) {
        return {
          userErrors: [{ message: 'You are not authorized to edit this collection' }],
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
