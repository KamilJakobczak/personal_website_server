import {
	Book,
	Covers,
	Language,
	Prisma,
	Publisher,
	Translator,
} from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';

interface BooksQueryArgs {
	input?: {
		filter: {
			genres: string[];
			publishers: string[];
		};
	};
}
interface BooksFeedArgs {
	input: {
		limit: number;
		offset: number;
		filter?: {
			genres: string[];
			publishers: string[];
		};
	};
}

interface BookArgs {
	input: {
		title: string;
		titleEnglish?: string;
		titleOriginal: string;
		language: Language;
		authors: string[];
		bookSeries?: string[];
		translators: string[];
		bookGenres: string[];
		pages: number;
		publisher: string;
		covers: Covers;
		isbn: string;
		firstEdition: number;
	};
}
interface BookUpdateArgs {
	input: {
		id: string;
		title?: string;
		titleEnglish?: string;
		titleOriginal?: string;
		language?: Language;
		authors?: string[];
		translators?: string[];
		bookGenres?: string[];
		pages?: number;
		publisher?: string;
		covers?: Covers;
		isbn?: string;
		firstEdition?: number;
		bookSeries?: string[];
	};
}
interface BookPayloadType {
	userErrors: {
		message: string;
	}[];
	book: Book | Prisma.Prisma__BookClient<Book> | null;
}

export const book = gql`
  extend type Query {
    book(id: ID!): Book
    books(input: BooksInput): [Book]!
    booksFeed(input: BooksFeedInput!): BooksFeedPayload!
  }
  type Mutation {
    addBook(input: addBookInput!): BookPayload!
    updateBook(input: updateBookInput!): BookPayload!
  }
  type Book implements Node {
    id: ID!
    title: String!
    titleEnglish: String
    titleOriginal: String
    language: Language
    authors: [Author]!
    bookSeries: [BookSeries]
    translators: [Translator]!
    bookGenres: [Genre]!
    pages: Int
    publisher: Publisher
    covers: Covers
    isbn: String
    firstEdition: String
    rating: Int
  }

  type Covers {
    original: String
    big: String
    medium: String
    small: String
  }
  type BookPayload {
    userErrors: [userError!]!
    book: Book
  }
  type BooksFeedPayload {
    books: [Book!]!
    totalCount: Int!
  }
  
  enum Language {
    English
    Polish
  }
  input BooksFeedInput {
    offset: Int
    limit: Int
    filter: BooksFilter
    }

  input BooksInput {
    filter: BooksFilter
  }
  
  input BooksFilter {
    genres: [String]!
    publishers: [String]!
  }
  input addBookInput {
    authors: [String]!
    bookGenres: [String]!
    bookSeries: [String]!
    covers: coversInput
    firstEdition: Int
    isbn: String
    language: Language
    pages: Int
    publisher: String
    title: String!
    titleEnglish: String
    titleOriginal: String!
    translators: [String]    
  }
  input updateBookInput {
    id: ID!
    title: String
    titleEnglish: String
    titleOriginal: String
    language: Language
    authors: [String]
    bookSeries: [String]
    translators: [String]
    bookGenres: [String]
    pages: Int
    publisher: String
    covers: coversInput
    isbn: String
    firstEdition: Int
  }

  input coversInput {
    original: String
    big: String
    medium: String
    small: String
  }
`;
export const bookResolvers = {
	Query: {
		book: (_: any, { id }: { id: string }, { prisma }: Context) => {
			return prisma.book.findUnique({
				where: {
					id: id,
				},
			});
		},
		books: async (_: any, { input }: BooksQueryArgs, { prisma }: Context) => {
			if (input) {
				const { filter } = input;
				const { genres, publishers } = filter;

				if (genres && publishers.length === 0) {
					const books = await prisma.book.findMany({
						where: {
							genreIDs: {
								hasSome: genres,
							},
						},
					});
					return books;
				} else if (genres.length === 0 && publishers) {
					const books = await prisma.book.findMany({
						where: {
							publisherID: { in: publishers },
						},
					});
					return books;
				} else if (genres && publishers) {
					const books = await prisma.book.findMany({
						where: {
							genreIDs: {
								hasSome: genres,
							},
							AND: {
								publisherID: { in: publishers },
							},
						},
					});
					return books;
				}
			} else {
				const books = await prisma.book.findMany({
					where: {
						title: {
							mode: 'insensitive',
						},
					},
					orderBy: {
						title: 'asc',
					},
				});
				const sortedBooks = books.sort((a, b) =>
					a.title.toLowerCase().localeCompare(b.title.toLowerCase())
				);
				return sortedBooks;
			}
		},
		booksFeed: async (
			_: any,
			{ input }: BooksFeedArgs,
			{ prisma }: Context
		) => {
			const { offset, limit, filter } = input;
			console.log(filter);

			if (filter) {
				const { genres, publishers } = filter;
				if (genres && publishers.length === 0) {
					const books = await prisma.book.findMany({
						skip: offset,
						take: limit,
						orderBy: { title: 'asc' },
						where: {
							genreIDs: {
								hasSome: genres,
							},
						},
					});
					const totalBooks = await prisma.book.count({
						where: { genreIDs: { hasSome: genres } },
					});

					return { books, totalCount: totalBooks };
				} else if (genres.length === 0 && publishers) {
					const books = await prisma.book.findMany({
						skip: offset,
						take: limit,
						orderBy: { title: 'asc' },
						where: {
							publisherID: { in: publishers },
						},
					});
					const totalBooks = await prisma.book.count({
						where: { publisherID: { in: publishers } },
					});
					return { books, totalCount: totalBooks };
				} else if (genres && publishers) {
					const books = await prisma.book.findMany({
						skip: offset,
						take: limit,
						orderBy: { title: 'asc' },
						where: {
							genreIDs: {
								hasSome: genres,
							},
							AND: {
								publisherID: { in: publishers },
							},
						},
					});
					const totalBooks = await prisma.book.count({
						where: {
							genreIDs: {
								hasSome: genres,
							},
							AND: {
								publisherID: { in: publishers },
							},
						},
					});
					return { books, totalCount: totalBooks };
				}
			} else {
				const totalCount = await prisma.book.count();
				const books = await prisma.book.findMany({
					skip: offset,
					take: limit,
					orderBy: { title: 'asc' },
				});

				return { books, totalCount };
			}
		},
	},
	Book: {
		authors: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
			const book = await prisma.book.findUnique({
				where: {
					id,
				},
			});
			const authors = book?.authorIDs;
			let authorsReturn: object[] = [];
			authors?.map(author => {
				authorsReturn.push(
					prisma.author.findUnique({
						where: {
							id: author,
						},
					})
				);
			});
			return authorsReturn;
		},
		publisher: async (
			{ id }: { id: string },
			__: any,
			{ prisma }: Context
		): Promise<Publisher | null> => {
			const book = await prisma.book.findUnique({
				where: {
					id,
				},
			});

			return prisma.publisher.findUnique({
				where: {
					id: book?.publisherID,
				},
			});
		},
		translators: async (
			{ id }: { id: string },
			__: any,
			{ prisma }: Context
		) => {
			const book = await prisma.book.findUnique({
				where: {
					id,
				},
			});

			const translators = book?.translatorIDs;

			let translatorsReturn: object[] = [];
			translators?.map(translator => {
				translatorsReturn.push(
					prisma.translator.findUnique({
						where: {
							id: translator,
						},
					})
				);
			});
			console.log('TRANSLATOR:', translatorsReturn);
			return translatorsReturn;
		},
		bookGenres: async (
			{ id }: { id: string },
			__: any,
			{ prisma }: Context
		) => {
			const book = await prisma.book.findUnique({
				where: {
					id,
				},
			});
			const bookGenres = book?.genreIDs;
			let bookGenresReturn: object[] = [];
			bookGenres?.map(bookGenre => {
				bookGenresReturn.push(
					prisma.genre.findUnique({
						where: {
							id: bookGenre,
						},
					})
				);
			});

			return bookGenresReturn;
		},
	},
	Mutation: {
		addBook: async (
			_: any,
			{ input }: BookArgs,
			{ prisma, req }: Context
		): Promise<BookPayloadType> => {
			const {
				authors,
				bookGenres,
				bookSeries,
				firstEdition,
				isbn,
				language,
				pages,
				publisher,
				title,
				titleEnglish,
				titleOriginal,
				translators,
			} = input;

			// Check whether similar record exists in the database already
			const bookExists = await prisma.book.findFirst({
				where: {
					OR: [
						{
							title: {
								equals: title,
								mode: 'insensitive',
							},
						},
						{
							title: {
								equals: titleEnglish,
								mode: 'insensitive',
							},
						},
						{
							title: {
								equals: titleOriginal,
								mode: 'insensitive',
							},
						},
						{
							isbn: isbn,
						},
					],
				},
			});
			if (bookExists) {
				return {
					userErrors: [
						{
							message:
								'Looks like the book you are trying to add exists in the database',
						},
					],
					book: bookExists,
				};
			}

			// if (bookSeries) {
			// 	bookSeries.forEach(async (series, index) => {
			// 		await prisma.bookSeries.update({
			// 			where: {
			// 				id: series,
			// 			},
			// 		data:{}
			// 		});
			// 	});
			// }
			return {
				userErrors: [
					{
						message: '',
					},
				],
				book: prisma.book.create({
					data: {
						title,
						titleEnglish,
						titleOriginal,
						language,
						authorIDs: authors,
						genreIDs: bookGenres,
						translatorIDs: translators,
						pages,
						publisherID: publisher,
						isbn,
						firstEdition,
						bookSeriesIDs: bookSeries,
					},
				}),
			};
		},
		updateBook: async (
			_: any,
			{ input }: BookUpdateArgs,
			{ prisma }: Context
		): Promise<BookPayloadType> => {
			console.log('updating BOOK MUTATION');
			const { id } = input;

			const bookExists = await prisma.book.findUnique({
				where: {
					id,
				},
			});
			if (!bookExists) {
				return {
					...{
						userErrors: [
							{ message: 'Book does not exist in the database' },
						],
					},
					book: null,
				};
			}

			const {
				title,
				titleEnglish,
				titleOriginal,
				language,
				authors,
				translators,
				bookGenres,
				pages,
				publisher,
				isbn,
				firstEdition,
			} = input;
			console.log(translators);
			let payloadToUpdate = {
				title,
				titleEnglish,
				titleOriginal,
				language,
				authorIDs: authors,
				genreIDs: bookGenres,
				translatorIDs: translators,
				pages,
				publisherID: publisher,
				isbn,
				firstEdition,
			};
			if (!title) {
				delete payloadToUpdate.title;
			}
			console.log(payloadToUpdate);
			return {
				userErrors: [{ message: '' }],
				book: prisma.book.update({
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
