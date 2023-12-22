const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  date: Date,
  details: String,
  projectId: String,
  status: {
    type: String,
    default: "Yet To start",
  },
  tags: [String],
  members: [String],
});

const Task = mongoose.model("Task", taskSchema, "Tasks");
module.exports = Task;
