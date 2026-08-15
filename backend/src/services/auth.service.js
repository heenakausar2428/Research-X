import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

// Load env values with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'dev_access_secret_key_1234567890';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_1234567890';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Helper to generate access and refresh tokens.
 */
const generateTokens = async (user) => {
  const payload = { id: user.id, email: user.email };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

  // Store refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

/**
 * Register a new user.
 */
export const register = async (userData) => {
  const { name, email, password, phone } = userData;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required fields.', 400);
  }

  // Check if email already registered
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create User
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = await generateTokens(user);

  return { user, ...tokens };
};

/**
 * Login user.
 */
export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Email and password are required fields.', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Generate tokens
  const tokens = await generateTokens(user);

  // Return clean user object
  const cleanUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };

  return { user: cleanUser, ...tokens };
};

/**
 * Refresh access token using active refresh token.
 */
export const refreshTokens = async (tokenString) => {
  if (!tokenString) {
    throw new AppError('Refresh token required.', 400);
  }

  // Verify token format
  let decoded;
  try {
    decoded = jwt.verify(tokenString, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please login again.', 401);
  }

  // Query token details from DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: tokenString },
    include: { user: true },
  });

  if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
    throw new AppError('Refresh token has expired or has been revoked.', 401);
  }

  // Revoke the old token (one-time use refresh tokens)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  // Generate new token pair
  const tokens = await generateTokens(storedToken.user);

  const cleanUser = {
    id: storedToken.user.id,
    name: storedToken.user.name,
    email: storedToken.user.email,
  };

  return { user: cleanUser, ...tokens };
};

/**
 * Revoke/Logout a refresh token.
 */
export const logout = async (tokenString) => {
  if (tokenString) {
    await prisma.refreshToken.updateMany({
      where: { token: tokenString },
      data: { isRevoked: true },
    });
  }
  return true;
};

