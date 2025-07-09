import { Prisma, Translator } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { FeedArgs } from '../interfaces';
type MongoAggregateResult<T> = {
	cursor?: {
		firstBatch?: T[];
	};
};
export const translator = gql`
 type Translator implements Node {
    id: ID!
    firstName: String!
    lastName: String!
    books: [Book]!
  }

  extend type Query {
    translator(id: ID!): Translator
    translators: [Translator!]!
    translatorsFeed(input: FeedInput!): TranslatorsFeedPayload!
  }

  type Mutation {
    addTranslator(input: addTranslatorInput): TranslatorPayload!
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
  type TranslatorsFeedPayload {
    translators: [Translator!]!
    totalCount: Int!
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
		translator: async (
			_: any,
			{ id }: { id: string },
			{ prisma }: Context
		) => {
			return prisma.translator.findUnique({
				where: {
					id,
				},
			});
		},
		translators: async (_: any, __: any, { prisma }: Context) => {
			const translators = await prisma.translator.findMany({
				orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
			});
			return translators.sort((a, b) =>
				a.lastName.localeCompare(b.lastName, 'pl', { sensitivity: 'base' })
			);
		},
		translatorsFeed: async (
			_: any,
			{ input }: FeedArgs,
			{ prisma }: Context
		) => {
			const { offset, limit } = input;
			let translators = await prisma.translator.findMany({
				skip: offset,
				take: limit,
				orderBy: { lastName: 'asc' },
			});
			translators.sort((a, b) =>
				a.lastName.localeCompare(b.lastName, 'pl', { sensitivity: 'base' })
			);

			const totalCount = await prisma.translator.count();
			return { translators, totalCount };
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

			const doesExist = await prisma.translator.findFirst({
				where: {
					firstName: {
						equals: firstName,
						mode: 'insensitive',
					},
					AND: {
						lastName: {
							equals: lastName,
							mode: 'insensitive',
						},
					},
				},
			});

			if (doesExist) {
				return {
					userErrors: [{ message: 'Translator exists in the database' }],
					translator: null,
				};
			}

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
		updateTranslator: async (
			_: any,
			{ id, input }: TranslatorUpdateArgs,
			{ prisma }: Context
		): Promise<TranslatorPayloadType> => {
			const { firstName, lastName } = input;
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
