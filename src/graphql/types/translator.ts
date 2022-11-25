import { Prisma, Translator } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import { authCheck } from './resolvers/auth';
export const translator = gql`
  extend type Query {
    translator(id: ID!): Translator
    translators: [Translator!]!
  }
  type Translator implements Node {
    id: ID!
    firstName: String
    lastName: String

    books(filter: BooksFilterInput): [Book]!
  }
  type Mutation {
    addTranslator(input: addTranslatorInput): TranslatorPayload!
    deleteTranslator(id: ID!): TranslatorPayload!
    updateTranslator(id: ID!, input: updateTranslatorArgs!): TranslatorPayload!
  }
  input addTranslatorInput {
    firstName: String!
    lastName: String!
  }
  input updateTranslatorArgs {
    firstName: String!
    lastName: String!
  }
  type TranslatorPayload {
    userErrors: [userError!]!
    translator: Translator
  }
`;
interface BooksParentType {
  id: string;
}
interface TranslatorArgs {
  input: { firstName: string; lastName: string };
}
interface TranslatorUpdateArgs {
  id: string;
  input: { firstName: string; lastName: string };
}
interface TranslatorPayloadType {
  userErrors: {
    message: string;
  }[];
  translator: Translator | Prisma.Prisma__TranslatorClient<Translator> | null;
}

export const translatorResolvers = {
  Query: {
    translator: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.translator.findUnique({
        where: {
          id,
        },
      });
    },
    translators: async (_: any, __: any, { prisma }: Context) => {
      return prisma.translator.findMany();
    },
  },
  Translator: {
    books: async ({ id }: BooksParentType, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          translatorIDs: {
            has: id,
          },
        },
      });
    },
  },
  Mutation: {
    addTranslator: async (
      _: any,
      { input }: TranslatorArgs,
      { prisma }: Context
    ): Promise<TranslatorPayloadType> => {
      const { firstName, lastName } = input;
      return {
        userErrors: [{ message: '' }],
        translator: prisma.translator.create({
          data: {
            firstName,
            lastName,
          },
        }),
      };
    },
    deleteTranslator: async (
      _: any,
      { id }: { id: string },
      { prisma, userInfo }: Context
    ): Promise<TranslatorPayloadType> => {
      const userAuth = await authCheck({ userInfo, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          translator: null,
        };
      }

      const translatorExists = await prisma.translator.findUnique({
        where: {
          id,
        },
      });
      if (!translatorExists) {
        return {
          ...{
            userErrors: [
              { message: 'Translator does not exist in the database' },
            ],
          },
          translator: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        translator: prisma.translator.delete({
          where: {
            id,
          },
        }),
      };
    },
    updateTranslator: async (
      _: any,
      { id, input }: TranslatorUpdateArgs,
      { prisma, userInfo }: Context
    ): Promise<TranslatorPayloadType> => {
      const { firstName, lastName } = input;
      const userAuth = await authCheck({ userInfo, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          translator: null,
        };
      }

      const translatorExists = await prisma.translator.findUnique({
        where: {
          id,
        },
      });
      if (!translatorExists) {
        return {
          ...{
            userErrors: [
              { message: 'Translator does not exist in the database' },
            ],
          },
          translator: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        translator: prisma.translator.update({
          where: {
            id,
          },
          data: {
            firstName,
            lastName,
          },
        }),
      };
    },
  },
};
