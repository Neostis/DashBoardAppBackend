const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  startDate: Date,
  endDate: Date,
  details: String,
  projectId: String,
  status: {
    type: String,
    enum: ["Yet to start", "In Progress", "Completed"],
    default: "Yet to start",
  },
  tags: [String],
  members: [String],
});

const Task = mongoose.model("Task", taskSchema, "Tasks");
module.exports = Task;
