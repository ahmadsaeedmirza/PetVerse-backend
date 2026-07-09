const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const vetsRouter = require('./routes/vetRoutes');
const usersRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.use(helmet());

app.use(cors({
    origin: 'http://localhost:5173', // allow frontend dev server
    credentials: true                // if you use cookies or auth headers
}));

// DEVELOPMENT LOGGING
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// BODY PARSER (READING DATA FROM BODY INTO REQ.BODY)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ROUTES
app.use('/api/v1/vets', vetsRouter);
app.use('/api/v1/users', usersRouter);

app.use(globalErrorHandler);

module.exports = app;