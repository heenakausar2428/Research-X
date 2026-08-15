import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Import configurations and middleware
import prisma from './config/db.js';
import initSocket from './socket/socketHandler.js';
import apiRouter from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/appError.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Socket.io
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Store io instance on app so controllers can access it
app.set('io', io);

// Initialize Socket event handling
initSocket(io);

// Serve uploaded literature and media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount main routing
app.use('/api', apiRouter);

// Health check / Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CivicPulse API Server is running smoothly',
    timestamp: new Date()
  });
});

// Handle 404 routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// Centralized error handler middleware
app.use(errorHandler);

// Establish database connection test and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test Database connection
    await prisma.$connect();
    console.log('Successfully connected to the database (Prisma ORM)');

    httpServer.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to Database connection issues:');
    console.error(error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections and exceptions gracefully
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});
