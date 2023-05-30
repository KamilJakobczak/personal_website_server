import { Prisma, prisma, Profile, UserBookDetails } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../prismaClient';

export const profile = gql`
  extend type Query {
    profile(id: ID!): Profile
    profiles: [Profile!]!
  }

  type Mutation {
    createProfile(input: createProfileInput!): ProfilePayload!
    deleteProfile(id: ID!): ProfilePayload!
    updateProfile(id: ID!, input: updateProfileInput!): ProfilePayload!
    addBookToShelf(id: ID!, input: addBookReadInput!): AddBookToShelfPayload!
  }

  type ProfilePayload {
    userErrors: [userError!]!
    profile: Profile
  }
  type AddBookToShelfPayload {
    userErrors: [userError!]!
    profile: Profile
    bookDetails: UserBookDetails
  }
  input createProfileInput {
    bio: String
  }
  input updateProfileInput {
    bio: String
  }
  input addBookReadInput {
    addBookRead: String!
  }
  type Profile implements Node {
    id: ID!
    bio: String!
    isMyProfile: Boolean!
    user: User!
    booksRead: [Book]
  }
`;
interface CreateProfileArgs {
  input: { bio: string };
}
interface UpdateProfileArgs {
  id: string;
  input: {
    bio?: string;
  };
}
interface AddBookToShelfArgs {
  id: string;
  input: {
    addBookRead: string;
  };
}
interface ProfilePayloadType {
  userErrors: { message: string }[];
  profile: Profile | Prisma.Prisma__ProfileClient<Profile> | null;
}
interface AddBookToShelfPayloadType {
  userErrors: { message: string }[];
  profile: Profile | Prisma.Prisma__ProfileClient<Profile> | null;
  bookDetails:
    | UserBookDetails
    | Prisma.Prisma__UserBookDetailsClient<UserBookDetails>
    | null;
}

export const profileResolvers = {
  Query: {
    profile: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.profile.findUnique({
        where: {
          id,
        },
      });
    },
    profiles: async (_: any, __: any, { prisma }: Context) => {
      return prisma.profile.findMany();
    },
  },
  Profile: {
    booksRead: () => {},
    isMyProfile: () => {},
    user: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      const profile = await prisma.profile.findUnique({ where: { id } });

      return prisma.user.findUnique({
        where: {
          id: profile?.userId,
        },
      });
    },
  },
  Mutation: {
    createProfile: async (
      _: any,
      { input }: CreateProfileArgs,
      { prisma, req }: Context
    ): Promise<ProfilePayloadType> => {
      const { bio } = input;
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          profile: null,
        };
      }
      const { id } = req.session.user;

      return {
        userErrors: [{ message: '' }],
        profile: prisma.profile.create({
          data: {
            userId: id,
            bio,
          },
        }),
      };
    },
    updateProfile: async (
      _: any,
      { input }: UpdateProfileArgs,
      { prisma, req }: Context
    ): Promise<ProfilePayloadType> => {
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          profile: null,
        };
      }
      const { profileId } = req.session.user;
      const { bio } = input;

      if (!profileId) {
        return {
          userErrors: [{ message: 'Create your profile first' }],
          profile: null,
        };
      }
      return {
        userErrors: [{ message: '' }],
        profile: prisma.profile.update({
          where: { id: profileId },
          data: { bio },
        }),
      };
    },
    addBookToShelf: async (
      _: any,
      { id, input }: AddBookToShelfArgs,
      { prisma, req }: Context
    ): Promise<AddBookToShelfPayloadType> => {
      if (!req.session.user) {
        return {
          userErrors: [{ message: 'Log in first' }],
          profile: null,
          bookDetails: null,
        };
      }
      const { profileId } = req.session.user;

      if (id !== profileId) {
        return {
          userErrors: [{ message: 'You can update only your profile' }],
          profile: null,
          bookDetails: null,
        };
      }

      return {
        userErrors: [{ message: '' }],
        profile: prisma.profile.update({
          where: {
            id,
          },
          data: {
            shelfBooksIDs: {
              push: input.addBookRead,
            },
          },
        }),
        bookDetails: prisma.userBookDetails.create({
          data: {
            profileID: id,
            bookID: input.addBookRead,
          },
        }),
      };
    },
  },
};
