const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const paymentSchema = new mongoose.Schema({
  usage: String,
  note: String,
  budget: String,
  change: Boolean,
  notification: [String],
  projectId: ObjectId,
});

const Payment = mongoose.model("Payment", paymentSchema, "Payments");
module.exports = Payment;
