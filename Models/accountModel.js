const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const accountSchema = new mongoose.Schema(
  {
    createDate: Date,
    updateDate: Date,
    name: String,
    role: String,
    email: String,
    phone: String,
    username: String,
    password: String,
    projects: [
      {
        projectId: { type: ObjectId, required: true },
        type: { type: String, required: true },
        _id: false,
      },
    ],
  },
  { versionKey: false }
);

const Account = mongoose.model("Account", accountSchema, "Accounts");
module.exports = Account;
