import gql from 'graphql-tag';
import { Author, BioPages, Prisma } from '@prisma/client';
import { Context } from '../../bookCollection/prismaClient';

interface BooksParentType {
  id: string;
}
interface AuthorArgs {
  input: {
    firstName: string;
    secondName?: string;
    thirdName?: string;
    lastName: string;
    nationality?: string;
    birthYear?: number;
    deathYear?: number;
    bioPages?: BioPages;
  };
}
interface AuthorUpdateArgs {
  input: {
    id: string;
    firstName?: string;
    secondName?: string;
    thirdName?: string;
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
    updateAuthor(input: updateAuthorInput!): AuthorPayload!
  }
  type Author implements Node {
    id: ID!
    firstName: String!
    secondName: String
    thirdName: String
    lastName: String!
    nationality: String
    birthYear: Int
    deathYear: Int
    bioPages: bioPages
    books: [Book]!
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
    secondName: String
    thirdName: String
    lastName: String!
    nationality: String
    birthYear: Int
    deathYear: Int
    bioPages: bioPagesInput
  }
  input updateAuthorInput {
    id: ID!
    firstName: String
    secondName: String
    thirdName: String
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
      { prisma, req }: Context
    ): Promise<AuthorPayloadType> => {
      // const authCheckVar = await authCheck({ req, prisma });

      // if (authCheckVar !== true) {
      //   return {
      //     ...authCheckVar,
      //     ...{ author: null },
      //   };
      // }

      const {
        firstName,
        secondName,
        thirdName,
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
              secondName,
              thirdName,
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
      { prisma, req }: Context
    ): Promise<AuthorPayloadType> => {
      const authorNull = { author: null };

      // const authCheckVar = await authCheck({ req, prisma });

      // if (authCheckVar !== true) {
      //   return {
      //     ...authCheckVar,
      //     ...authorNull,
      //   };
      // }
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
      { input }: AuthorUpdateArgs,
      { prisma, req }: Context
    ): Promise<AuthorPayloadType> => {
      // const authCheckVar = await authCheck({ req, prisma });
      // if (authCheckVar !== true) {
      //   return {
      //     ...authCheckVar,
      //     author: null,
      //   };
      // }

      const {
        id,
        firstName,
        secondName,
        thirdName,
        lastName,
        nationality,
        birthYear,
        deathYear,
        bioPages,
      } = input;

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

      let payloadToUpdate = {
        firstName,
        secondName,
        thirdName,
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
