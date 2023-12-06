const mongoose = require("mongoose");

const FilesDetailsSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    lastModified: Date
  },
  { collection: "FilesDetails" }
);

mongoose.model("FilesDetails", FilesDetailsSchema);
