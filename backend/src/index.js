require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/test', require('./routes/test'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));

const port = process.env.PORT || 5000;

(async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
})();