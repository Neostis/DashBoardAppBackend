const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  projects: [
    {
      projectID: { type: ObjectId, required: true },
      type: { type: String, required: true },
      _id: false,
    },
  ],
});

const Member = mongoose.model("Members", memberSchema, "Members"); // Specify 'TestMembers' as the collection name
module.exports = Member;
