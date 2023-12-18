const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectId: String,
    type: String,
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  projects: [projectSchema],
});
const Member = mongoose.model("Member", memberSchema, "Members");
module.exports = Member;
