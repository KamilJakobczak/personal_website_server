import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createCellsRouter } from './routes';
import { collectionRouter } from './apollo/routes';
import { imagesRouter } from './apollo/imagesRouter';
import { uploadRouter } from './apollo/uploadRouter';

import { sessionConfig } from './sessions';

export const app = express();
app.use(function (req, res, next) {
  // Website you wish to allow to connect

  // Request methods you wish to allow

  // Request headers you wish to allow

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)

  res.header('Access-Control-Allow-Origin', 'https://localhost:3000'); // update to match the domain you will make the request from
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

// app.use(cookieParser());

app.use(
  cors<cors.CorsRequest>({
    credentials: true,
    methods: ['POST', 'GET', 'PUT', 'OPTIONS', 'HEAD'],
    origin: ['https://localhost:3000', 'https://192.168.0.199:3000'],
    // exposedHeaders: ['set-cookie'],
  })
);

export const requireAuth = (req: any, res: any, next: any) => {
  const { user } = req.session;
  if (!user) {
    return res.status(401).json({ message: 'not logged in' });
  }
  next();
};

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/projects/coding', createCellsRouter());
app.use('/api/images', imagesRouter);

app.use(sessionConfig);

app.use('/api/graphql', collectionRouter);

app.use('/api/upload', uploadRouter);
