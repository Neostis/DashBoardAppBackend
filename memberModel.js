const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const memberSchema = new mongoose.Schema({
  projectID: ObjectId,
  name: String,
  role: String,
  email: String,
  type: String,
});
const Member = mongoose.model("Member", memberSchema, "Members");
module.exports = Member;
