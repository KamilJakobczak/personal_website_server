import { Context } from '../../../prismaClient';

export const authCheck = async ({ req, prisma }: Context) => {
  if (!req.session.user) {
    return {
      userErrors: [{ message: 'unauthenticated access' }],
    };
  }
  const { id } = req.session.user;

  const user = await prisma.user.findUnique({
    where: {
      id: id,
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
