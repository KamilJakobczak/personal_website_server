import gql from 'graphql-tag';
import { Author, BioPages, Prisma } from '@prisma/client';
import { Context } from '../../prismaClient';
import { authCheck } from './resolvers/auth';

interface BooksParentType {
  id: string;
}
interface AuthorArgs {
  input: {
    firstName: string;
    lastName: string;
    nationality?: string;
    birthYear?: number;
    deathYear?: number;
    bioPages?: BioPages;
  };
}
interface AuthorUpdateArgs {
  id: string;
  input: {
    firstName?: string;
    lastName?: string;
    nationality?: string;
    birthYear?: number;
    deathYear?: number;
    bioPages?: {
      wiki: string;
      goodreads: string;
      lubimyczytac: string;
    };
  };
}
String;
interface AuthorPayloadType {
  userErrors: {
    message: string;
  }[];
  author: Author | Prisma.Prisma__AuthorClient<Author> | null;
}

export const author = gql`
  extend type Query {
    author(id: ID!): Author
    authors: [Author!]!
  }

  type Mutation {
    addAuthor(input: addAuthorInput!): AuthorPayload!
    deleteAuthor(id: ID!): AuthorPayload!
    updateAuthor(id: ID!, input: updateAuthorInput!): AuthorPayload!
  }
  type Author implements Node {
    id: ID!
    firstName: String!
    lastName: String!
    nationality: String
    birthYear: Int
    deathYear: Int
    bioPages: bioPages
    books(filter: BooksFilterInput): [Book]
  }
  type userError {
    message: String!
  }

  type bioPages {
    wiki: String
    goodreads: String
    lubimyczytac: String
  }
  type AuthorPayload {
    userErrors: [userError!]!
    author: Author
  }
  input bioPagesInput {
    wiki: String
    goodreads: String
    lubimyczytac: String
  }
  input addAuthorInput {
    firstName: String!
    lastName: String!
    nationality: String
    birthYear: Int
    deathYear: Int
    bioPages: bioPagesInput
  }
  input updateAuthorInput {
    firstName: String
    lastName: String
    nationality: String
    birthYear: Int
    deathYear: Int
    bioPages: bioPagesInput
  }
`;
export const authorResolvers = {
  Query: {
    author: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.author.findUnique({
        where: {
          id: id,
        },
      });
    },
    authors: async (_: any, __: any, { prisma }: Context) => {
      const result = await prisma.author.findMany({
        orderBy: [
          {
            lastName: 'asc',
          },
        ],
      });

      return result;
    },
  },
  Author: {
    books: async (parent: BooksParentType, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          authorIDs: {
            has: parent.id,
          },
        },
      });
    },
  },
  Mutation: {
    addAuthor: async (
      _: any,
      { input }: AuthorArgs,
      { prisma, userInfo }: Context
    ): Promise<AuthorPayloadType> => {
      const authCheckVar = await authCheck({ userInfo, prisma });
      if (authCheckVar !== true) {
        return {
          ...authCheckVar,
          ...{ author: null },
        };
      }

      const {
        firstName,
        lastName,
        nationality,
        birthYear,
        deathYear,
        bioPages,
      } = input;
      const authorExists = await prisma.author.findFirst({
        where: {
          firstName: {
            contains: firstName,
            mode: 'insensitive',
          },
          lastName: {
            contains: lastName,
            mode: 'insensitive',
          },
          nationality: nationality ? nationality.toLowerCase() : null,
          birthYear,
        },
      });
      if (!authorExists) {
        return {
          userErrors: [{ message: '' }],
          author: prisma.author.create({
            data: {
              firstName: firstName,
              lastName: lastName,
              nationality: nationality ? nationality.toLowerCase() : null,
              birthYear,
              deathYear,
              bioPages: bioPages
                ? {
                    wiki: bioPages.wiki,
                    goodreads: bioPages.goodreads,
                    lubimyczytac: bioPages.lubimyczytac,
                  }
                : null,
            },
          }),
        };
      } else {
        return {
          userErrors: [
            {
              message: 'Author already exists in the database',
            },
          ],
          author: null,
        };
      }
    },
    deleteAuthor: async (
      _: any,
      { id }: { id: string },
      { prisma, userInfo }: Context
    ): Promise<AuthorPayloadType> => {
      const authorNull = { author: null };
      const authCheckVar = await authCheck({ userInfo, prisma });
      if (authCheckVar !== true) {
        return {
          ...authCheckVar,
          ...authorNull,
        };
      }
      return {
        userErrors: [
          {
            message: '',
          },
        ],
        author: prisma.author.delete({
          where: {
            id,
          },
        }),
      };
    },
    updateAuthor: async (
      _: any,
      { id, input }: AuthorUpdateArgs,
      { prisma, userInfo }: Context
    ): Promise<AuthorPayloadType> => {
      const authCheckVar = await authCheck({ userInfo, prisma });
      if (authCheckVar !== true) {
        return {
          ...authCheckVar,
          author: null,
        };
      }
      const author = await prisma.author.findUnique({
        where: {
          id,
        },
      });
      if (!author) {
        return {
          userErrors: [
            {
              message: 'Author does not exist in the database',
            },
          ],
          author: null,
        };
      }
      const {
        firstName,
        lastName,
        nationality,
        birthYear,
        deathYear,
        bioPages,
      } = input;

      let payloadToUpdate = {
        firstName,
        lastName,
        nationality,
        birthYear,
        deathYear,
        bioPages,
      };

      if (!firstName) {
        delete payloadToUpdate.firstName;
      }
      if (!lastName) {
        delete payloadToUpdate.lastName;
      }
      if (!nationality) {
        delete payloadToUpdate.nationality;
      }
      if (!birthYear) {
        delete payloadToUpdate.birthYear;
      }
      if (!deathYear) {
        delete payloadToUpdate.deathYear;
      }
      if (!bioPages) {
        delete payloadToUpdate.bioPages;
      }
      return {
        userErrors: [
          {
            message: '',
          },
        ],
        author: prisma.author.update({
          where: {
            id,
          },
          data: {
            ...payloadToUpdate,
          },
        }),
      };
    },
  },
};
