import { Genre, Prisma } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { FeedArgs } from '../interfaces';

interface BooksParentType {
  id: string;
}
interface GenreArgs {
  input: { name: string; namePolish: string };
}
interface GenreUpdateArgs {
  input: { id: string; name: string; namePolish: string };
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
    genresFeed(input: FeedInput!): GenresFeedPayload!
  }

  type Mutation {
    addGenre(input: addGenreInput): GenrePayload!
    updateGenre(input: updateGenreInput!): GenrePayload!
  }

  input addGenreInput {
    name: String!
  }
  input updateGenreInput {
    id: ID!
    name: String!
    namePolish: String!
  }
  type GenrePayload {
    userErrors: [userError!]!
    genre: Genre
  }
  type GenresFeedPayload {
    genres: [Genre!]!
    totalCount: Int
  }
  type Genre implements Node {
    id: ID!
    name: String!
    namePolish: String
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
    genresFeed: async (_: any, { input }: FeedArgs, { prisma }: Context) => {
      const { offset, limit } = input;
      const genres = await prisma.genre.findMany({
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      });
      const totalCount = await prisma.genre.count();
      return { genres, totalCount };
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
    addGenre: async (_: any, { input }: GenreArgs, { prisma }: Context): Promise<GenrePayloadType> => {
      const { name, namePolish } = input;
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
            namePolish: namePolish.toLowerCase(),
          },
        }),
      };
    },
    updateGenre: async (_: any, { input }: GenreUpdateArgs, { prisma }: Context): Promise<GenrePayloadType> => {
      const { id, name, namePolish } = input;

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

      if (!name && !namePolish) {
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
            namePolish,
          },
          where: {
            id,
          },
        }),
      };
    },
  },
};
