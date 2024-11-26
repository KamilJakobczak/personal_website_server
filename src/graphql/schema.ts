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
import { deleteResolver, deleteSingleRecord } from './types/resolvers/deleteResolver';

const Query = gql`
  type Query {
    _empty: String
  }
  type DeletePayload {
    userErrors: [userError!]!
    success: Boolean!
  }
  type userError {
    message: String!
  }
  input FeedInput {
    offset: Int
    limit: Int
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
    deleteSingleRecord,
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
    userResolvers,
    deleteResolver
  ),
});

const middleware = {
  Query: {
    checkLogin: isLoggedInMiddleware,
  },
  Mutation: {
    // Log in required
    // createCustomCollection: isLoggedInMiddleware,
    // deleteCustomCollection: isLoggedInMiddleware,
    // updateCustomCollection: isLoggedInMiddleware,
    createProfile: isLoggedInMiddleware,
    deleteProfile: isLoggedInMiddleware,
    updateProfile: isLoggedInMiddleware,
    signout: isLoggedInMiddleware,
    // userBookDetails: isLoggedInMiddleware,
    // addUserBookDetails: isLoggedInMiddleware,
    // deleteUserBookDetails: isLoggedInMiddleware,
    // updateUserBookDetails: isLoggedInMiddleware,
    // Admin rights required
    addAuthor: combinedMiddleware,
    updateAuthor: combinedMiddleware,
    addBook: combinedMiddleware,
    updateBook: combinedMiddleware,
    addBookSeries: combinedMiddleware,
    updateBookSeries: combinedMiddleware,
    addGenre: combinedMiddleware,
    updateGenre: combinedMiddleware,
    addPublisher: combinedMiddleware,
    updatePublisher: combinedMiddleware,
    addTranslator: combinedMiddleware,
    updateTranslator: combinedMiddleware,
    deleteRecord: combinedMiddleware,
  },
};

const schemaWithMiddleware = applyMiddleware(schema, middleware);
export default schemaWithMiddleware;
