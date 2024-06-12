const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

// Redis
const redisClient = redis.createClient({
    host: 'redis',
    port: 6379,
});

app.use(bodyParser.json());


app.post('/messages', (req, res) => {
    const message = req.body.message;
    redisClient.lpush('messages', message, (err, reply) => {
        if (err) return res.status(500).send(err);
        res.send({ status: 'Message added', reply });
    });
});


app.get('/messages', (req, res) => {
    redisClient.lrange('messages', 0, -1, (err, messages) => {
        if (err) return res.status(500).send(err);
        res.send({ messages });
    });
});


app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
        res.send(result.rows[0]);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(port, () => {
    console.log(`App on ${port}`);
});
