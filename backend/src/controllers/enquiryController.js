import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireStrings, assertEmail, optionalString, queryString } from '../utils/validators.js';

// POST /api/enquiries/wholesale  (public)
export const createWholesaleEnquiry = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['name', 'businessName', 'phone', 'email', 'city', 'productCategory']);
  assertEmail(req.body.email);

  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new HttpError(400, 'Quantity must be a whole number of 1 or more');
  }

  await Enquiry.create({
    type: 'wholesale',
    name: req.body.name,
    businessName: req.body.businessName,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    productCategory: req.body.productCategory,
    quantity,
    message: optionalString(req.body.message),
  });

  res.status(201).json({ message: 'Thank you! Your enquiry has been received.' });
});

// POST /api/enquiries/contact  (public)
export const createContactMessage = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['name', 'email', 'message']);
  assertEmail(req.body.email);

  await Enquiry.create({
    type: 'contact',
    name: req.body.name,
    email: req.body.email,
    phone: optionalString(req.body.phone),
    message: req.body.message,
  });

  res.status(201).json({ message: 'Thank you! We have received your message.' });
});

// GET /api/enquiries?type=&status=  (admin)
export const listEnquiries = asyncHandler(async (req, res) => {
  const filter = {};
  const type = queryString(req.query.type);
  const status = queryString(req.query.status);
  if (type) filter.type = type;
  if (status) filter.status = status;

  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
  res.json({ enquiries });
});

// PATCH /api/enquiries/:id/status  { status }  (admin)
export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    throw new HttpError(400, 'status must be one of: new, contacted, closed');
  }

  const enquiry = mongoose.isValidObjectId(req.params.id) ? await Enquiry.findById(req.params.id) : null;
  if (!enquiry) throw new HttpError(404, 'Enquiry not found');

  enquiry.status = status;
  await enquiry.save();
  res.json({ enquiry });
});
