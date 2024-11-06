import { deleteRecord } from '../../../bookCollection/prismaClient';
import { PrismaModel } from '../../../bookCollection/prismaClient';
export const deleteResolver = {
  Mutation: {
    deleteRecord: async (
      _: any,
      { model, id }: { model: PrismaModel; id: string }
    ) => {
      try {
        const deletedRecord = await deleteRecord(model, id);
        return {
          userErrors: [{ message: '' }],
          success: true,
        };
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
