import {
  Book,
  Collection,
  Covers,
  Language,
  Prisma,
  Publisher,
} from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { authCheck } from './resolvers/auth';

interface BooksQueryArgs {
  input?: {
    filter: {
      genres: string[];
      publishers: string[];
    };
  };
}

interface BookArgs {
  input: {
    title: string;
    language: Language;
    authors: string[];
    collections: string[];
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
  id: string;
  input: {
    title?: string;
    language?: Language;
    authors?: string[];
    translators?: string[];
    bookGenres?: string[];
    pages?: number;
    publisher?: string;
    covers?: Covers;
    isbn?: string;
    firstEdition?: number;
    collections: string[];
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
  }
  type Mutation {
    addBook(input: addBookInput!): BookPayload!
    deleteBook(id: ID!): BookPayload!
    updateBook(id: ID!, input: updateBookInput!): BookPayload!
  }
  type Book implements Node {
    id: ID!
    title: String!
    language: Language
    authors: [Author]!
    collections: [Collection]!
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
  type userError {
    message: String!
  }

  enum Language {
    English
    Polish
  }

  input BooksInput {
    filter: BooksFilter
  }

  input BooksFilter {
    genres: [String]!
    publishers: [String]!
  }
  input addBookInput {
    title: String!
    language: Language
    authors: [String]!
    collection: [String]
    translators: [String]
    bookGenres: [String]!
    pages: Int
    publisher: String
    covers: coversInput
    isbn: String
    firstEdition: Int
  }
  input updateBookInput {
    title: String
    language: Language
    authors: [String]
    collection: [String]
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
        console.log('AAAAA', genres, publishers);
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
        }

        if (genres && publishers) {
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
        return prisma.book.findMany();
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
          prisma.author.findUnique({
            where: {
              id: translator,
            },
          })
        );
      });

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
      const userAuth = await authCheck({ req, prisma });
      if (userAuth !== true) {
        return {
          ...userAuth,
          book: null,
        };
      }

      const {
        title,
        language,
        authors,
        translators,
        bookGenres,
        pages,
        publisher,
        // covers,
        isbn,
        firstEdition,
        collections,
      } = input;
      // const { original, big, medium, small } = covers;

      // Check whether similar record already exists in the database
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
                'Looks like the book you are trying to add already exists in the database',
            },
          ],
          book: bookExists,
        };
      }

      return {
        userErrors: [
          {
            message: '',
          },
        ],
        book: prisma.book.create({
          data: {
            title,
            language,
            authorIDs: authors,
            genreIDs: bookGenres,
            translatorIDs: translators,
            pages,
            publisherID: publisher,
            isbn,
            firstEdition,
            collectionIDs: collections,
          },
        }),
      };
    },
    deleteBook: async (
      _: any,
      { id }: { id: string },
      { prisma, req }: Context
    ): Promise<BookPayloadType> => {
      const userAuth = await authCheck({ req, prisma });
      const bookExists = await prisma.book.findUnique({
        where: {
          id,
        },
      });
      if (!bookExists) {
        return {
          ...{
            userErrors: [{ message: 'Book does not exist in the database' }],
          },
          book: null,
        };
      }

      if (userAuth !== true) {
        return {
          ...userAuth,
          book: null,
        };
      }

      return {
        userErrors: [
          {
            message: '',
          },
        ],
        book: prisma.book.delete({
          where: {
            id,
          },
        }),
      };
    },
    updateBook: async (
      _: any,
      { id, input }: BookUpdateArgs,
      { prisma, req }: Context
    ): Promise<BookPayloadType> => {
      const userAuth = await authCheck({ req, prisma });
      const bookExists = await prisma.book.findUnique({
        where: {
          id,
        },
      });
      if (!bookExists) {
        return {
          ...{
            userErrors: [{ message: 'Book does not exist in the database' }],
          },
          book: null,
        };
      }

      if (userAuth !== true) {
        return {
          ...userAuth,
          book: null,
        };
      }

      const {
        title,
        language,
        authors,
        translators,
        bookGenres,
        pages,
        publisher,
        // covers,
        isbn,
        firstEdition,
      } = input;

      let payloadToUpdate = {
        title,
        language,
        authorIDs: authors,
        genreIDs: bookGenres,
        translatorIDs: translators,
        pages,
        publisherID: publisher,
        isbn,
        firstEdition,
      };
      if (!title || title === bookExists.title) {
        delete payloadToUpdate.title;
      }
      if (!language || language === bookExists.language) {
        delete payloadToUpdate.language;
      }
      if (!authors || authors === bookExists.authorIDs) {
        delete payloadToUpdate.authorIDs;
      }
      if (!bookGenres || bookGenres === bookExists.genreIDs) {
        delete payloadToUpdate.genreIDs;
      }
      if (!translators || translators === bookExists.translatorIDs) {
        delete payloadToUpdate.translatorIDs;
      }
      if (!pages || pages === bookExists.pages) {
        delete payloadToUpdate.pages;
      }
      if (!publisher || publisher === bookExists.publisherID) {
        delete payloadToUpdate.publisherID;
      }
      if (!isbn || isbn === bookExists.isbn) {
        delete payloadToUpdate.isbn;
      }
      if (!firstEdition || firstEdition === bookExists.firstEdition) {
        delete payloadToUpdate.firstEdition;
      }

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
