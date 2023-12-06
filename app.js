const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use("/files", express.static("files"));
const fs = require('fs');
const path = require('path');

// MongoDB connection
const mongoUrl =
  "mongodb+srv://admin:admin@cluster0.5wtjno2.mongodb.net/a?retryWrites=true&w=majority";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

// Multer
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

// Import and use the model
require("./filesDetails");
const FilesDetails = mongoose.model("FilesDetails");
const upload = multer({ storage: storage });

app.post("/upload-files", upload.single("file"), async (req, res) => {
  const title = req.file.originalname;
  // Use lastIndexOf to find the last dot in the string
  const lastDotIndex = title.lastIndexOf(".");

  // Check if there is a dot in the string
  const filenameWithoutExtension =
    lastDotIndex !== -1 ? title.substring(0, lastDotIndex) : title;
  const type = /[.]/.exec(title) ? /[^.]+$/.exec(title) : undefined;
  const lastModified = Date.now();
  try {
    await FilesDetails.create({
      title: filenameWithoutExtension,
      type: type[0],
      lastModified: lastModified,
    });

    const filePath = path.join(__dirname, 'files', req.file.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });

    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  try {
    FilesDetails.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Internal Server Error" });
  }
});

// APIs
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started");
});
