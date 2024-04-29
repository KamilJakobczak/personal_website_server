import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import MongoStore from 'connect-mongo';

const mongoStore = MongoStore.create({
  mongoUrl:
    'mongodb+srv://jamardracken:ZdZtNR9jwoqbhRyO@cluster0.0d3ymvv.mongodb.net/sessions?retryWrites=true&w=majority',
  // 'mongodb://localhost:27017/sessions?retryWrites=true&w=majority'
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
  touchAfter: 24 * 3600,
  crypto: { secret: 'asdasdasd' }, //SET A SERIOUS ONE
});

export const sessionConfig = session({
  store: mongoStore,
  secret: process.env.SECRET ? process.env.SECRET : 'dummy_secret', //SET A SERIOUS ONE
  resave: true, // check store spec to set this up correctly
  saveUninitialized: true,
  genid: function (req) {
    console.log(req.sessionID);
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
