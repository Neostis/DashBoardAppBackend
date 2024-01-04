const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const timelineSchema = new mongoose.Schema({
  label: String,
  taskId: ObjectId,
  projectId: ObjectId,
  connections: [Object],
  dateStart: Date,
  dateEnd: Date,
  type: String,
});

const Timeline = mongoose.model("Timeline", timelineSchema, "Timelines");
module.exports = Timeline;
