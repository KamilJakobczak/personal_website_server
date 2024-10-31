import session from 'express-session';
import MongoStore from 'connect-mongo';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';

const mongoStore = MongoStore.create({
  mongoUrl: config.sessions,
  collectionName: 'coding_sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
  touchAfter: 24 * 3600,
  crypto: { secret: config.secret },
});
export const codingSessions = session({
  store: mongoStore,
  secret: config.secret,
  saveUninitialized: false,
  resave: true,
  genid: function (req) {
    return uuidv4();
  },
  name: 'codingSession',
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 10,
  },
});
