import { Context } from '../../../prismaClient';

export const authCheck = async ({ userInfo, prisma }: Context) => {
  if (!userInfo) {
    return {
      userErrors: [{ message: 'unauthenticated access' }],
    };
  }
  const { userId } = userInfo;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return {
      userErrors: [{ message: 'user not found' }],
    };
  } else {
    if (user.role !== 'ADMIN') {
      return {
        userErrors: [
          { message: 'Not authorized to add records to the database' },
        ],
      };
    }
    return true;
  }
};

// export const userCheck = async ({ userInfo, prisma }: Context) => {
//   if (!userInfo) {
//     return {
//       userErrors: [{ message: 'Log in first' }],
//     };
//   }
//   const { userId } = userInfo;
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   });
//   if (!user) {
//     return {
//       userErrors: [{ message: 'user not found' }],
//     };
//   }
//   return true;
// };
