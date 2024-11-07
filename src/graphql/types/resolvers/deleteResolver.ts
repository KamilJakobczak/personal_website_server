import { gql } from 'apollo-server';
import { prisma } from '../../../bookCollection/prismaClient';

export const deleteSingleRecord = gql`
  extend type Mutation {
    deleteRecord(model: String!, id: ID!): DeletePayload!
}
`;
// Define the union type for PrismaModel
export type PrismaModel =
  | 'author'
  | 'book'
  | 'genre'
  | 'publisher'
  | 'profile'
  | 'translator'
  | 'user'
  | 'bookSeries';

// Define the interface for the payload type
export interface DeletePayloadType {
  userErrors: {
    message: string;
  }[];
  success: boolean;
}

const deleteRecord = async (model: PrismaModel, id: string) => {
  // Define the model delegate with necessary methods
  const modelDelegate = prisma[model] as unknown as {
    delete: (args: { where: { id: string } }) => Promise<any>;
    findUnique: (args: { where: { id: string } }) => Promise<any>;
  };
  // Check if the delete method exists on the model delegate
  if (!modelDelegate.delete) {
    throw new Error(`Model ${model} does not exist or is not deletable`);
  }
  // Check if the record exists before attempting to delete
  const record = await modelDelegate.findUnique({
    where: { id },
  });

  if (!record) {
    throw new Error(`Record with id: ${id} does not exist in model: ${model}`);
  }

  try {
    // Attempt to delete the record
    const deletedRecord = await modelDelegate.delete({
      where: { id },
    });
    // Log the successful deletion
    console.log(`Deleted ${model}:`, deletedRecord);
    return {
      userErrors: [{ message: '' }],
      success: true,
    };
  } catch (error: any) {
    // Log any errors that occur during deletion
    console.error(`Error deleting ${model}`, error);
    return {
      userErrors: [{ message: `${error.message}` }],
      success: false,
    };
  }
};

export const deleteResolver = {
  Mutation: {
    deleteRecord: async (
      _: any,
      { model, id }: { model: PrismaModel; id: string }
    ): Promise<DeletePayloadType> => {
      try {
        const deletedRecord = await deleteRecord(model, id);
        return deletedRecord;
      } catch (error: any) {
        return {
          userErrors: [
            {
              message: `${error.message}`,
            },
          ],
          success: false,
        };
      }
    },
  },
};
