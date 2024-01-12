const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
  title: String,
});

const Project = mongoose.model("Project", projectSchema, "Projects");
module.exports = Project;
