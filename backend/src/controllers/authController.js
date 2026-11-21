import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireStrings, assertEmail, optionalString } from '../utils/validators.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  customerType: user.customerType,
  businessName: user.businessName,
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['name', 'email', 'password']);
  assertEmail(req.body.email);

  const { password } = req.body;
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }

  const customerType = 'retail';

  const email = req.body.email.trim().toLowerCase();
  if (await User.findOne({ email })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password,
    phone: optionalString(req.body.phone),
    customerType,
    businessName,
  });

  res.status(201).json({ token: signToken(user._id), user: userResponse(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['email', 'password']);

  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user._id), user: userResponse(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: userResponse(req.user) });
});
