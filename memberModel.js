const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  type: String,
});
const Member = mongoose.model("Member", memberSchema, "Members");
module.exports = Member;
