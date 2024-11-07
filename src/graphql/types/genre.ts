import { Genre, Prisma } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';

interface BooksParentType {
  id: string;
}
interface GenreArgs {
  input: { name: string };
}
interface GenreUpdateArgs {
  id: string;
  input: { name: string };
}
interface GenrePayloadType {
  userErrors: {
    message: string;
  }[];
  genre: Genre | Prisma.Prisma__GenreClient<Genre> | null;
}

export const genre = gql`
  extend type Query {
    genre(id: ID!): Genre
    genres: [Genre!]!
  }

  type Mutation {
    addGenre(input: addGenreInput): GenrePayload!
    updateGenre(id: ID!, input: updateGenreInput!): GenrePayload!
  }

  input addGenreInput {
    name: String!
  }
  input updateGenreInput {
    name: String!
  }
  type GenrePayload {
    userErrors: [userError!]!
    genre: Genre
  }

  type Genre implements Node {
    id: ID!
    name: String!
    books: [Book!]!
  }
`;

export const genreResolvers = {
  Query: {
    genre: (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.genre.findUnique({
        where: {
          id,
        },
      });
    },
    genres: (_: any, __: any, { prisma }: Context) => {
      return prisma.genre.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
      });
    },
  },
  Genre: {
    books: async ({ id }: BooksParentType, __: any, { prisma }: Context) => {
      return prisma.book.findMany({
        where: {
          genreIDs: {
            has: id,
          },
        },
      });
    },
  },
  Mutation: {
    addGenre: async (
      _: any,
      { input }: GenreArgs,
      { prisma }: Context
    ): Promise<GenrePayloadType> => {
      const { name } = input;
      const doesExist = await prisma.genre.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });
      if (doesExist) {
        return {
          userErrors: [{ message: 'Genre already exists in the database' }],
          genre: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        genre: prisma.genre.create({
          data: {
            name: name.toLowerCase(),
          },
        }),
      };
    },
    updateGenre: async (
      _: any,
      { id, input }: GenreUpdateArgs,
      { prisma }: Context
    ): Promise<GenrePayloadType> => {
      const { name } = input;

      const genreExists = prisma.genre.findUnique({
        where: {
          id,
        },
      });
      if (!genreExists) {
        return {
          userErrors: [{ message: 'genre of specified id does not exist' }],
          genre: null,
        };
      }

      if (!name) {
        return {
          userErrors: [{ message: 'must provide a new name' }],
          genre: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        genre: prisma.genre.update({
          data: {
            name,
          },
          where: {
            id,
          },
        }),
      };
    },
  },
};
