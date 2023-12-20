const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  projects: [
    {
      projectId: { type: ObjectId, required: true },
      type: { type: String, required: true },
      _id: false,
    },
  ],
});

const Member = mongoose.model("Member", memberSchema, "Members"); // Specify 'Members' as the collection name
module.exports = Member;
