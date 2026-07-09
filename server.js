const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtRejection', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT REJECTION!!! SHUTTING DOWN....');
    process.exit(1);
})

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB)
    .then(() => console.log('Database connection is successfull!'));

const port = process.env.PORT;

const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION!!! SHUTTING DOWN...');
    server.close(() => {
        process.exit(1);
    });
});