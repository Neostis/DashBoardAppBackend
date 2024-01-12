const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const paymentSchema = new mongoose.Schema({
  usage: String,
  note: String,
  budget: String,
  change: Boolean,
  notification: {
    type: [String],
    enum: ['Phone', 'Email'],
    default: [] // Default value is an empty array
  },  projectId: ObjectId,
});

const Payment = mongoose.model("Payment", paymentSchema, "Payments");
module.exports = Payment;
