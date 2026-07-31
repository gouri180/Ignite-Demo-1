const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true }, // sparse allows multiple docs with no phone
  college: String,
  teamName: String,
  members: String,
  teamMembers: String, // stored as JSON string, same as before
  category: String,
  institutionName: String,
  domain: String,
  problemStatement: String,
  abstract: String,
  paymentStatus: { type: String, default: 'Pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  registeredAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Keeps an "id" field in responses (like before), backed by Mongo's _id
registrationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

registrationSchema.statics.findByEmail = function (email) {
  if (!email || !email.trim()) return null;
  return this.findOne({ email: email.trim().toLowerCase() });
};

registrationSchema.statics.findByPhone = function (phone) {
  if (!phone || !phone.trim()) return null;
  return this.findOne({ phone: phone.trim() });
};

registrationSchema.statics.findAll = function () {
  return this.find().sort({ registeredAt: -1 });
};

registrationSchema.statics.deleteById = async function (id) {
  const result = await this.deleteOne({ _id: id });
  return result.deletedCount > 0;
};

registrationSchema.statics.updatePaymentStatus = async function (email, status) {
  const result = await this.updateOne(
    { email: email.trim().toLowerCase() },
    { paymentStatus: status }
  );
  return result.modifiedCount > 0;
};

// Note: findById() and create() are built into Mongoose already,
// so we don't need to redefine them here.

module.exports = mongoose.model('Registration', registrationSchema);
