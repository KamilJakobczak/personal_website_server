export const sesssionCheck = (req: any, res: any, next: any) => {
  console.log(`Session Checker: ${req.session.id}`);
  console.log(req.session);
  if (req.session.user) {
    console.log('Found user session');
    next();
  } else {
    console.log('No user session found');
    res.redirect('/');
  }
};
