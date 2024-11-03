import * as express from 'express';
import { handleUpload } from '../utility/handleUpload';
import config from '../../config';

export const uploadRouter = express.Router();

const { host, frontPort } = config;

// Middleware for All Routes
uploadRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());
    res.header('Access-Control-Allow-Origin', `https://${host}:${frontPort}`);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  }
});

uploadRouter.post('/', async (req, res) => {
  try {
    const data = await handleUpload(req, res);
    res.send(data);
  } catch (error) {
    console.error(`Error handling upload`, error);
    res.status(500).send('Internal Server Error');
  }
});
