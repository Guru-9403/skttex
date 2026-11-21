import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

// Requires a valid "Authorization: Bearer <token>" header
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Please log in to continue');
  }

  const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new HttpError(401, 'This account no longer exists');
  }

  req.user = user;
  next();
});

// Use after protect, e.g. restrictTo('admin')
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to do this'));
    }
    next();
  };
