import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

/**
 * Middleware to verify JWT Access Token and attach user to request object.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please login.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_access_secret_key_1234567890');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token has expired. Please refresh.', 401));
      }
      return next(new AppError('Invalid token. Please login again.', 401));
    }

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
