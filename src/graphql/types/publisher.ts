import { Prisma, Publisher, Address } from '@prisma/client';
import gql from 'graphql-tag';
import { Context } from '../../bookCollection/prismaClient';
import { FeedArgs } from '../interfaces';
import { BooksParentType } from '../interfaces';

interface PublisherPayloadType {
	userErrors: { message: string }[];
	publisher: Publisher | Prisma.Prisma__PublisherClient<Publisher> | null;
}
interface PublisherArgs {
	input: {
		name: string;
		address: {
			country: string;
			zipCode: string;
			city: string;
			street: string;
			buildingNr: string;
			placeNr: string;
		};
		website?: string;
	};
}
interface PublisherUpdateArgs {
	input: {
		id: string;
		name?: string;
		address?: {
			country?: string;
			zipCode?: string;
			city?: string;
			street?: string;
			buildingNr?: string;
			placeNr?: string;
		};
		website?: string;
	};
}

export const publisher = gql`
  extend type Query {
    publisher(id: ID!): Publisher
    publishers: [Publisher!]!
    publishersFeed(input: FeedInput!): PublishersFeedPayload!
  }
  type Mutation {
    addPublisher(input: addPublisherInput): PublisherPayload!
    updatePublisher(input: updatePublisherInput!): PublisherPayload!
  }
  type Publisher implements Node {
    id: ID!
    name: String
    address: Address
    website: String
    books: [Book]!
  }
  type PublisherPayload {
    userErrors: [userError!]!
    publisher: Publisher
  }
  type PublishersFeedPayload{
    publishers: [Publisher!]!
    totalCount: Int!
  }
  type Address {
    country: String
    zipCode: String
    city: String
    street: String
    buildingNr: String
    placeNr: String
  }
  input addressInput {
    country: String
    zipCode: String
    city: String
    street: String
    buildingNr: String
    placeNr: String
  }
  input addPublisherInput {
    name: String!
    address: addressInput
    website: String
  }
  input updatePublisherInput {
    id: ID!
    name: String
    address: addressInput
    website: String
  }
`;
export const publisherResolvers = {
	Query: {
		publisher: async (
			_: any,
			{ id }: { id: string },
			{ prisma }: Context
		) => {
			return prisma.publisher.findUnique({
				where: {
					id,
				},
			});
		},
		publishers: async (_: any, __: any, { prisma }: Context) => {
			const result = prisma.publisher.findMany({
				orderBy: {
					name: 'asc',
				},
			});
			return result;
		},
		publishersFeed: async (
			_: any,
			{ input }: FeedArgs,
			{ prisma }: Context
		) => {
			const { offset, limit } = input;
			const publishers = await prisma.publisher.findMany({
				skip: offset,
				take: limit,
				orderBy: { name: 'asc' },
			});
			const totalCount = await prisma.publisher.count();
			return { publishers, totalCount };
		},
	},
	Publisher: {
		books: ({ id }: BooksParentType, __: any, { prisma }: Context) => {
			return prisma.book.findMany({
				where: {
					publisherID: id,
				},
			});
		},
	},
	Mutation: {
		addPublisher: async (
			_: any,
			{ input }: PublisherArgs,
			{ prisma }: Context
		): Promise<PublisherPayloadType> => {
			const { name, address, website } = input;
			const { country, zipCode, city, street, buildingNr, placeNr } =
				address;

			const doesExist = await prisma.publisher.findFirst({
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
						{ message: 'Genre already exists in the database' },
					],
					publisher: null,
				};
			}

			return {
				userErrors: [{ message: '' }],
				publisher: prisma.publisher.create({
					data: {
						name,
						address: {
							country,
							zipCode,
							city,
							street,
							buildingNr,
							placeNr,
						},
						website,
					},
				}),
			};
		},

		updatePublisher: async (
			_: any,
			{ input }: PublisherUpdateArgs,
			{ prisma }: Context
		) => {
			const { id } = input;
			const publisherExists = await prisma.publisher.findUnique({
				where: {
					id,
				},
			});
			if (!publisherExists) {
				return {
					...{
						userErrors: [
							{ message: 'Publisher does not exist in the database' },
						],
					},
					publisher: null,
				};
			}
			const { name, address, website } = input;
			const { country, zipCode, city, street, buildingNr, placeNr } =
				address || {};

			let publisherPayloadToUpdate = {
				name,
				website,
				address,
			};
			// let addressPayloadToUpdate = {
			//   country,
			//   zipCode,
			//   city,
			//   street,
			//   buildingNr,
			//   placeNr,
			// };

			if (!name) {
				delete publisherPayloadToUpdate.name;
			}
			if (!website) {
				delete publisherPayloadToUpdate.website;
			}

			return {
				userErrors: [{ message: '' }],
				publisher: prisma.publisher.update({
					where: { id },
					data: {
						...publisherPayloadToUpdate,
					},
				}),
			};
		},
	},
};
