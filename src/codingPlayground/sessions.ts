import session from 'express-session';
import MongoStore from 'connect-mongo';
import { v4 as uuidv4 } from 'uuid';

const mongoStore = MongoStore.create({
  mongoUrl:
    'mongodb+srv://jamardracken:ZdZtNR9jwoqbhRyO@cluster0.0d3ymvv.mongodb.net/sessions?retryWrites=true&w=majority',
  collectionName: 'coding_sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
  touchAfter: 24 * 3600,
  crypto: { secret: 'asdghjfjhf' }, //SET A SERIOUS ONE
});
export const codingSessions = session({
  store: mongoStore,
  secret: process.env.SECRET ? process.env.SECRET : 'dummy_secret', //SET A SERIOUS ONE
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
