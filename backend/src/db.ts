import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'e2',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 25,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Test the connection
pool.getConnection()
  .then((connection) => {
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  })
  .catch((err) => {
    console.error('Error connecting to the MySQL database:', err);
  });

export default pool;
