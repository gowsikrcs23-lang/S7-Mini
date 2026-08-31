import mongoose from 'mongoose';
import { ApiError } from './apiError.js';

export const assertObjectId = (id, label = 'Resource') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} id is invalid`);
  }
};

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }
};

export const assertPhoneNumber = (phone, label = 'Phone number') => {
  if (phone !== undefined && phone !== '' && !/^\d{10}$/.test(String(phone))) {
    throw new ApiError(400, `${label} must contain exactly 10 digits`);
  }
};

export const assertEmergencyContact = (contact) => {
  if (!contact) return;
  if (contact.name && !contact.phone) {
    throw new ApiError(400, 'Emergency phone is required when an emergency contact name is provided');
  }
  assertPhoneNumber(contact.phone, 'Emergency phone');
};
