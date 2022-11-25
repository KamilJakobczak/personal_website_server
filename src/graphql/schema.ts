import { merge } from 'lodash';
import {
  author,
  authorResolvers,
  book,
  bookResolvers,
  genre,
  genreResolvers,
  publisher,
  publisherResolvers,
  profile,
  profileResolvers,
  translator,
  translatorResolvers,
  userBookDetails,
  user,
  userResolvers,
  userBookDetailsResolvers,
} from './types';
import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';
import { collection, collectionResolvers } from './types/collection';
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
    collection,
    genre,
    publisher,
    profile,
    translator,
    user,
    userBookDetails,
  ],
  resolvers: merge(
    authorResolvers,
    bookResolvers,
    collectionResolvers,
    genreResolvers,
    publisherResolvers,
    profileResolvers,
    translatorResolvers,
    userBookDetailsResolvers,
    userResolvers
  ),
});
export default schema;
