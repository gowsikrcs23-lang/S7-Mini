import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, requireFields } from '../utils/validators.js';
import { serializeUser } from '../utils/user.js';

const getEmail = (email) => String(email).trim().toLowerCase();

const assertRole = (role) => {
  if (role !== 'Admin' && role !== 'Staff') throw new ApiError(400, 'Role must be Admin or Staff');
};

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(serializeUser));
});

export const createUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  assertRole(req.body.role || 'Staff');

  const email = getEmail(req.body.email);
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({
    name: req.body.name,
    email,
    password: req.body.password,
    role: req.body.role || 'Staff'
  });

  res.status(201).json(serializeUser(user));
});

export const updateUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'User');
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id) && req.body.role && req.body.role !== 'Admin') {
    throw new ApiError(400, 'You cannot change your own admin role');
  }

  if (req.body.email !== undefined) {
    const email = getEmail(req.body.email);
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) throw new ApiError(409, 'Email is already registered');
    user.email = email;
  }
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.role !== undefined) {
    assertRole(req.body.role);
    user.role = req.body.role;
  }
  if (req.body.password) user.password = req.body.password;

  await user.save();
  res.json(serializeUser(user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'User');
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'Admin' && await User.countDocuments({ role: 'Admin' }) <= 1) {
    throw new ApiError(400, 'At least one admin account must remain');
  }

  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
