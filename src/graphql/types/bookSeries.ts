import { BookSeries, Prisma } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { FeedArgs } from '../interfaces';
import { BooksParentType } from '../interfaces';

interface BookSeriesArgs {
	input: {
		name: string;
		booksInBookSeries: {
			tome: string;
			bookId: string;
		}[];
	};
}
interface BookSeriesUpdateArgs {
	input: {
		id: string;
		name: string;
		booksInBookSeries: {
			tome: string;
			bookId: string;
		}[];
	};
}
interface BookSeriesPayloadType {
	userErrors: {
		message: string;
	}[];
	bookSeries: BookSeries | Prisma.Prisma__BookSeriesClient<BookSeries> | null;
}

export const bookSeries = gql`
  extend type Query {
    singleBookSeries(id: ID!): BookSeries
    bookSeries: [BookSeries!]!
    bookSeriesFeed(input: FeedInput!): BookSeriesFeedPayload!
  }

  type Mutation {
    addBookSeries(input: addBookSeriesInput!): BookSeriesPayload!
    updateBookSeries(input: updateBookSeriesInput!): BookSeriesPayload
  }

  type BookSeriesPayload {
    userErrors: [userError!]!
    bookSeries: BookSeries
  }
  type BookSeriesFeedPayload {
    bookSeries: [BookSeries!]!
    totalCount: Int!
  }

  input addBookSeriesInput {
    name: String!
    booksInBookSeries: [BookInBookSeriesInput]
  }
  input updateBookSeriesInput {
    id: ID!
    name: String
    booksInBookSeries: [BookInBookSeriesInput]
  }
  input BookInBookSeriesInput {
    tome: String!
    bookId: ID!
  }

  type BookSeries implements Node {
    id: ID!
    name: String!
    booksInBookSeries: [BookInBookSeries]!
	 books: [Book!]!
  }
  type BookInBookSeries {
    tome: String
    bookId: ID!
    book: Book!
  }
`;

export const bookSeriesResolvers = {
	Query: {
		singleBookSeries: (
			_: any,
			{ id }: { id: string },
			{ prisma }: Context
		) => {
			return prisma.bookSeries.findUnique({
				where: {
					id,
				},
			});
		},
		bookSeries: (_: any, __: any, { prisma }: Context) => {
			return prisma.bookSeries.findMany();
		},
		bookSeriesFeed: async (
			_: any,
			{ input }: FeedArgs,
			{ prisma }: Context
		) => {
			const { offset, limit } = input;
			const bookSeries = await prisma.bookSeries.findMany({
				skip: offset,
				take: limit,
				orderBy: { name: 'asc' },
			});

			const totalCount = await prisma.bookSeries.count();
			return { bookSeries, totalCount };
		},
	},
	BookSeries: {
		books: async ({ id }: BooksParentType, __: any, { prisma }: Context) => {
			return prisma.book.findMany({
				where: {
					bookSeriesIDs: {
						has: id,
					},
				},
			});
		},
	},
	Mutation: {
		addBookSeries: async (
			_: any,
			{ input }: BookSeriesArgs,
			{ prisma }: Context
		): Promise<BookSeriesPayloadType> => {
			const { name, booksInBookSeries } = input;
			if (name === '') {
				return {
					userErrors: [{ message: 'Must provide a name' }],
					bookSeries: null,
				};
			}
			const doesExist = await prisma.bookSeries.findFirst({
				where: {
					name: {
						equals: name,
						mode: 'insensitive',
					},
				},
			});
			if (doesExist) {
				return {
					userErrors: [
						{ message: 'BookSeries already exists in the database' },
					],
					bookSeries: null,
				};
			}
			const bookSeries = await prisma.bookSeries.create({
				data: {
					name: name,
					booksInBookSeries,
				},
			});
			await prisma.book.updateMany({
				where: {
					id: {
						in: booksInBookSeries.map(book => book.bookId),
					},
				},
				data: {
					bookSeriesIDs: {
						push: bookSeries.id,
					},
				},
			});

			return {
				userErrors: [{ message: '' }],
				bookSeries,
			};
		},

		updateBookSeries: async (
			_: any,
			{ input }: BookSeriesUpdateArgs,
			{ prisma }: Context
		): Promise<BookSeriesPayloadType> => {
			const { id, name, booksInBookSeries } = input;

			const bookSeriesExists = await prisma.bookSeries.findUnique({
				where: {
					id,
				},
			});
			if (!bookSeriesExists) {
				return {
					userErrors: [
						{ message: 'book series of specified id does not exist' },
					],
					bookSeries: null,
				};
			}

			if (!name) {
				return {
					userErrors: [{ message: 'must provide a new name' }],
					bookSeries: null,
				};
			}
			// Books being updated
			const updatedBookIDs = booksInBookSeries.map(book => book.bookId);
			// Books already in relation to current book series
			const allRelatedBooks = await prisma.book.findMany({
				where: {
					bookSeriesIDs: { has: id },
				},
				select: {
					id: true,
					bookSeriesIDs: true,
				},
			});
			// Get books to be deleted

			const booksToDelete = allRelatedBooks.filter(
				book => !updatedBookIDs.includes(book.id)
			);
			console.log(booksToDelete);
			await Promise.all(
				booksToDelete.map(book =>
					prisma.book.update({
						where: { id: book.id },
						data: {
							bookSeriesIDs: {
								set: book.bookSeriesIDs.filter(
									seriesId => seriesId !== id
								),
							},
						},
					})
				)
			);

			const booksToUpdate = await prisma.book.findMany({
				where: {
					id: { in: updatedBookIDs },
				},
				select: {
					id: true,
					bookSeriesIDs: true,
				},
			});
			const newBooksToAdd = booksToUpdate.filter(
				book => !book.bookSeriesIDs.includes(id)
			);
			await Promise.all(
				newBooksToAdd.map(book =>
					prisma.book.update({
						where: { id: book.id },
						data: {
							bookSeriesIDs: {
								push: id,
							},
						},
					})
				)
			);

			return {
				userErrors: [{ message: '' }],
				bookSeries: await prisma.bookSeries.update({
					data: {
						name,
						booksInBookSeries,
					},
					where: {
						id,
					},
				}),
			};
		},
	},
};
