const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use("/files", express.static("files"));
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");

// MongoDB connection
const mongoUrl =
  "mongodb+srv://admin:admin@cluster0.5wtjno2.mongodb.net/a?retryWrites=true&w=majority";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

// Multer
const multer = require("multer");

const storage = multer.memoryStorage(); // Use memory storage for multer

const upload = multer({ storage: storage });

app.post("/upload-files", upload.single("file"), async (req, res) => {
  const title = req.file.originalname;
  const type = path.extname(title).substr(1);
  const lastModified = Date.now();

  try {
    const db = mongoose.connection.db; // Access the native MongoDB driver's database object
    const bucket = new mongoose.mongo.GridFSBucket(db);

    // Create a readable stream from the file buffer
    const readableStream = require('stream').Readable.from([req.file.buffer]);

    // Upload the file to GridFS
    const uploadStream = bucket.openUploadStream(title, {
      contentType: req.file.mimetype,
      metadata: {
        title: title,
        type: type,
        lastModified: lastModified,
      },
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', async () => {
      // Remove the file from the local filesystem
      // (assuming that you don't need it after uploading to GridFS)
      res.send({ status: "ok" });
    });
  } catch (error) {
    console.error(error);
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  const db = mongoose.connection.db; // Access the native MongoDB driver's database object
  const filesCollection = db.collection('fs.files');

  try {
    // Retrieve all files from fs.files
    const allFiles = await filesCollection.find().toArray();

    // Send the list of files as a response
    res.json(allFiles);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/get-file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const db = mongoose.connection.db; // Access the native MongoDB driver's database object
    const bucket = new mongoose.mongo.GridFSBucket(db);

    const fileMetadata = await bucket.find({ _id: ObjectId(fileId) }).toArray();

    if (fileMetadata.length === 0) {
      return res.status(404).json({ error: "File does not exist." });
    }

    bucket.openDownloadStream(ObjectId(fileId)).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// APIs
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started");
});
