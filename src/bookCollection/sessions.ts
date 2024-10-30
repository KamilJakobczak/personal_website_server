import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import MongoStore from 'connect-mongo';
import config from '../../config';

const mongoStore = MongoStore.create({
  mongoUrl: config.sessions,
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
  touchAfter: 24 * 3600,
  crypto: { secret: config.secret },
});

export const bookSessions = session({
  store: mongoStore,
  secret: config.secret,
  resave: true,
  saveUninitialized: true,
  genid: function (req) {
    return uuidv4();
  },
  name: 'session',
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 10,
  },
});
