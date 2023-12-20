const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  date: Date,
  details: String,
  projectId: String,
  status: String,
  tags: [String],
  members: [String],
});

const Task = mongoose.model("Task", taskSchema, "Tasks");
module.exports = Task;
