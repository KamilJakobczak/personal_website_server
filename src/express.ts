import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { createCellsRouter } from './routes';
import { collectionRouter } from './apollo/routes';
import { imagesRouter } from './apollo/imagesRouter';
import { uploadRouter } from './apollo/uploadRouter';

export const app = express();
app.use(function (req, res, next) {
  // res.header('Access-Control-Allow-Origin', 'https://studio.apollographql.com'); // update to match the domain you will make the request from
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.use(function (req, res, next) {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/projects/coding', createCellsRouter());
app.use('/api/graphql', collectionRouter);
app.use('/api/images', imagesRouter);
app.use('/api/upload', uploadRouter);
