import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Handle user registration request.
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'User registered successfully.', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login request.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, 'Login successful.', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle token refresh request.
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, 'Tokens refreshed successfully.', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user logout request.
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return sendSuccess(res, 'Logout successful.', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle getting current user info.
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the requireAuth middleware
    return sendSuccess(res, 'Current user profile retrieved.', { user: req.user }, 200);
  } catch (error) {
    next(error);
  }
};
