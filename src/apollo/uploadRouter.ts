import express from 'express';

export const uploadRouter = express.Router();

uploadRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

uploadRouter.post('/', async (req, res) => {
  console.log(req.body);
  res.send('file received');
});
