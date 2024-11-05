import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';
import { merge } from 'lodash';
import { combinedMiddleware, isLoggedInMiddleware } from './middlewares';
import {
  author,
  authorResolvers,
  book,
  bookResolvers,
  bookSeries,
  bookSeriesResolvers,
  genre,
  genreResolvers,
  publisher,
  publisherResolvers,
  profile,
  searchableUnion,
  searchableUnionResolvers,
  profileResolvers,
  translator,
  translatorResolvers,
  userBookDetails,
  user,
  userResolvers,
  userBookDetailsResolvers,
} from './types';

gql;

const Query = gql`
  type Query {
    _empty: String
  }
  interface Node {
    id: ID!
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [
    Query,
    author,
    book,
    bookSeries,
    genre,
    publisher,
    profile,
    translator,
    searchableUnion,
    user,
    userBookDetails,
  ],
  resolvers: merge(
    authorResolvers,
    bookResolvers,
    bookSeriesResolvers,
    genreResolvers,
    publisherResolvers,
    profileResolvers,
    searchableUnionResolvers,
    translatorResolvers,
    userBookDetailsResolvers,
    userResolvers
  ),
});

const middleware = {
  Query: {
    checkLogin: isLoggedInMiddleware,
  },
  Mutation: {
    // Log in required
    createCustomCollection: isLoggedInMiddleware,
    deleteCustomCollection: isLoggedInMiddleware,
    updateCustomCollection: isLoggedInMiddleware,
    createProfile: isLoggedInMiddleware,
    deleteProfile: isLoggedInMiddleware,
    updateProfile: isLoggedInMiddleware,
    signout: isLoggedInMiddleware,
    userBookDetails: isLoggedInMiddleware,
    addUserBookDetails: isLoggedInMiddleware,
    deleteUserBookDetails: isLoggedInMiddleware,
    updateUserBookDetails: isLoggedInMiddleware,
    // Admin rights required
    addAuthor: combinedMiddleware,
    deleteAuthor: combinedMiddleware,
    updateAuthor: combinedMiddleware,
    addBook: combinedMiddleware,
    deleteBook: combinedMiddleware,
    updateBook: combinedMiddleware,
    addBookSeries: combinedMiddleware,
    deleteBookSeries: combinedMiddleware,
    updateBookSeries: combinedMiddleware,
    addGenre: combinedMiddleware,
    deleteGenre: combinedMiddleware,
    updateGenre: combinedMiddleware,
    addPublisher: combinedMiddleware,
    deletePublisher: combinedMiddleware,
    updatePublisher: combinedMiddleware,
    addTranslator: combinedMiddleware,
    deleteTranslator: combinedMiddleware,
    updateTranslator: combinedMiddleware,
  },
};

const schemaWithMiddleware = applyMiddleware(schema, middleware);
export default schemaWithMiddleware;
