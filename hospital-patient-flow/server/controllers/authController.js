import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireFields } from '../utils/validators.js';
import { serializeUser } from '../utils/user.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: 'Staff'
  });

  res.status(201).json({ user: serializeUser(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ user: serializeUser(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});
