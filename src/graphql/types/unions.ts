import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';

export const searchableUnion = gql`
  extend type Query {
    search(contains: String!, type: String!): [SearchResult!]
  }
  union SearchResult = Book | Publisher | Author
`;

export const searchableUnionResolvers = {
  SearchResult: {
    __resolveType(obj: any, contextValue: any, info: any) {
      if (obj.title) {
        return 'Book';
      }
      if (obj.lastName) {
        return 'Author';
      }
      if (obj.name) {
        return 'Publisher';
      }
      return null;
    },
  },
  Query: {
    search: async (_: any, { contains, type }: { contains: string; type: string }, { prisma }: Context) => {
      switch (type) {
        case 'Book':
          return prisma.book.findMany({
            orderBy: {
              title: 'asc',
            },
            where: {
              title: {
                contains: contains,
                mode: 'insensitive',
              },
            },
          });
        case 'Publisher':
          return prisma.publisher.findMany({
            orderBy: {
              name: 'asc',
            },
            where: {
              name: {
                contains: contains,
                mode: 'insensitive',
              },
            },
          });

        case 'Author':
          return prisma.author.findMany({
            orderBy: {
              lastName: 'asc',
            },
            where: {
              OR: [
                { firstName: { contains: contains, mode: 'insensitive' } },
                { lastName: { contains: contains, mode: 'insensitive' } },
              ],
            },
          });

        default:
          return null;
      }
    },
  },
};
