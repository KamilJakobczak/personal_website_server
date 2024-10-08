import * as express from 'express';

import { handleUpload } from '../utility/handleUpload';

export const uploadRouter = express.Router();

uploadRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());
    res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
    next();
  }
});

uploadRouter.post('/', async (req, res) => {
  const uploadedFile = handleUpload(req, res);
  uploadedFile
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log(err);
      res.send(err);
    });

  // const data = await epubParser(uploadedFile);
});
