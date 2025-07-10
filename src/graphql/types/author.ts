import gql from 'graphql-tag';
import { Author, BioPages, Prisma } from '@prisma/client';
import { Context } from '../../bookCollection/prismaClient';
import { FeedArgs } from '../interfaces';
import { BooksParentType } from '../interfaces';

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
    authorsFeed(input: FeedInput!): AuthorsFeedPayload!
  }

  type Mutation {
    addAuthor(input: addAuthorInput!): AuthorPayload!
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
  
  type bioPages {
    wiki: String
    goodreads: String
    lubimyczytac: String
  }
  type AuthorPayload {
    userErrors: [userError!]!
    author: Author
  }
  type AuthorsFeedPayload {
    authors: [Author!]!
    totalCount: Int!
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
		authorsFeed: async (_: any, { input }: FeedArgs, { prisma }: Context) => {
			const { offset, limit } = input;
			const authors = await prisma.author.findMany({
				skip: offset,
				take: limit,
				orderBy: { lastName: 'asc' },
			});

			const totalCount = await prisma.author.count();
			return { authors, totalCount };
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
							nationality: nationality
								? nationality.toLowerCase()
								: null,
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
		updateAuthor: async (
			_: any,
			{ input }: AuthorUpdateArgs,
			{ prisma }: Context
		): Promise<AuthorPayloadType> => {
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
