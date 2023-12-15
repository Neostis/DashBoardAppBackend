/* The code you provided is a Node.js server using the Express framework. It sets up a server that
listens on port 5000 and handles various routes for file upload, retrieval, and deletion using
MongoDB's GridFS for storing files. */
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
const Member = require("./memberModel");
var db;
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

//Check if connection establish
mongoose.connection.once("open", () => {
  db = mongoose.connection.db;
});
// Multer
const multer = require("multer");
const memberModel = require("./memberModel");

const storage = multer.memoryStorage(); // Use memory storage for multer

const upload = multer({ storage: storage });

// const db = mongoose.connection.db; // Access the native MongoDB driver's database object

app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

/* The code you provided is a route handler for retrieving a list of files from the server. It listens
for GET requests to the '/get-files' endpoint. */
app.get("/get-files", async (req, res) => {
  const filesCollection = db.collection("fs.files");

  try {
    // Retrieve all files from fs.files
    const allFiles = await filesCollection.find().toArray();

    // Send the list of files as a response
    res.json(allFiles);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* The code you provided is a route handler for retrieving a file from the server. It listens for GET
requests to the '/get-file/:fileId' endpoint, where ':fileId' is a parameter representing the ID of
the file to be retrieved. */
app.get("/get-file/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const bucket = new mongoose.mongo.GridFSBucket(db);

    const fileMetadata = await bucket.find({ _id: ObjectId(fileId) }).toArray();

    if (fileMetadata.length === 0) {
      return res.status(404).json({ error: "File does not exist." });
    }

    bucket.openDownloadStream(ObjectId(fileId)).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* The code you provided is a route handler for retrieving a list of files from the server. It listens
for GET requests to the '/get-files' endpoint. */
app.get("/get-projects", async (req, res) => {
  const db = mongoose.connection.db; // Access the native MongoDB driver's database object
  const projectsCollection = db.collection('Projects');

  try {
    // Retrieve all files from fs.files
    const allProject = await projectsCollection.find().toArray();

    // Send the list of files as a response
    res.json(allProject);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

/* The code you provided is a route handler for uploading a file to the server. It listens for POST
requests to the '/upload-files/:projectID' endpoint, where ':projectID' is a parameter representing
the ID of the project the file belongs to. */
app.post("/upload-files/:projectID", upload.single("file"), async (req, res) => {
  const title = req.file.originalname;
  const type = path.extname(title).substr(1);
  const lastModified = Date.now();
  const projectID = mongoose.Types.ObjectId( req.params.projectID);
  
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
        projectID: projectID, // Add projectID to the metadata
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

/* The code you provided is a route handler for deleting a file from the server. It listens for DELETE
requests to the '/delete-file/:fileId' endpoint, where ':fileId' is a parameter representing the ID
of the file to be deleted. */
app.delete("/delete-file/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const bucket = new mongoose.mongo.GridFSBucket(db);

    const fileMetadata = await bucket.find({ _id: ObjectId(fileId) }).toArray();

    if (fileMetadata.length === 0) {
      return res.status(404).json({ error: "File does not exist." });
    }

    // Remove the file from GridFS
    await bucket.delete(ObjectId(fileId));

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.listen(5000, () => {
  console.log("Server Started");
});

app.get("/members/search", async (req, res) => {
  // const membersCollection = db.collection("Members");

  try {
    const searchTerm = req.query.name;
    //insensitive
    const regex = new RegExp(searchTerm, "i");
    const members = await Member.find({
      $or: [
        {
          name: regex,
        },
        {
          role: regex,
        },
        {
          email: regex,
        },
        {
          type: regex,
        },
      ],
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  // membersCollection.find({}).toArray((err, members) => {
  //   if (err) {
  //     console.error("Error occurred while fetching files:", err);
  //     res.status(500).json({ error: "Internal server error" });
  //     return;
  //   }

  //   res.json(members); // Send the retrieved files as JSON response
  // });
});
