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
  // res.append('Access-Control-Allow-Origin', 'http://localhost:3333');

  // Website you wish to allow to connect

  res.setHeader('Access-Control-Allow-Origin', 'https://192.168.0.199:3333');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,content-type,set-cookie'
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', 'include');
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3333'); // update to match the domain you will make the request from
  // res.header(
  //   'Access-Control-Allow-Headers',
  //   'Origin, X-Requested-With, Content-Type, Accept'
  // );
  next();
});
app.use(function (req, res, next) {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

app.use(cookieParser());

app.use(
  cors<cors.CorsRequest>({
    credentials: true,
    origin: ['https://localhost:3333', 'https://192.168.0.199:3333'],
    exposedHeaders: ['set-cookie'],
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/projects/coding', createCellsRouter());
app.use('/api/graphql', collectionRouter);
app.use('/api/images', imagesRouter);
app.use('/api/upload', uploadRouter);
