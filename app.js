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
const Task = require("./taskModel");

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
  const projectsCollection = db.collection("Projects");

  try {
    // Retrieve all files from fs.files
    const allProject = await projectsCollection.find().toArray();

    // Send the list of files as a response
    res.json(allProject);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* The code you provided is a route handler for uploading a file to the server. It listens for POST
requests to the '/upload-files/:projectId' endpoint, where ':projectId' is a parameter representing
the ID of the project the file belongs to. */
app.post(
  "/upload-files/:projectId",
  upload.single("file"),
  async (req, res) => {
    const title = req.file.originalname;
    const type = path.extname(title).substr(1);
    const lastModified = Date.now();
    const projectId = mongoose.Types.ObjectId(req.params.projectId);

    try {
      const db = mongoose.connection.db; // Access the native MongoDB driver's database object
      const bucket = new mongoose.mongo.GridFSBucket(db);

      // Create a readable stream from the file buffer
      const readableStream = require("stream").Readable.from([req.file.buffer]);

      // Upload the file to GridFS
      const uploadStream = bucket.openUploadStream(title, {
        contentType: req.file.mimetype,
        metadata: {
          title: title,
          type: type,
          lastModified: lastModified,
          projectId: projectId, // Add projectId to the metadata
        },
      });

      readableStream.pipe(uploadStream);

      uploadStream.on("finish", async () => {
        // Remove the file from the local filesystem
        // (assuming that you don't need it after uploading to GridFS)
        res.send({ status: "ok" });
      });
    } catch (error) {
      console.error(error);
      res.json({ status: error });
    }
  }
);

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

app.get("/members/getProjectMembers", async (req, res) => {
  const ProjectId = new ObjectId(req.query.projectId);
  try {
    const members = await Member.find({ "projects.ProjectId": ProjectId });
    const filterMembers = members
      .map((m) => ({
        name: m.name,
        role: m.role,
        email: m.email,
        projects: m.projects,
      }))
      .filter((m) => m.projects.length > 0);

    res.json(filterMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/members/search", async (req, res) => {
  try {
    const searchTerm = req.query.name;
    const projectId = req.query.projectId;
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
});

// Your endpoint to add a member
// app.post("/add-member", async (req, res) => {
//   try {
//     // Extract member details from the request body
//     const { name, role, email, projects } = req.body;

//     // Create an array to store the updated projects
//     const updatedProjects = [];

//     // Loop through the provided projects and update the projectId
//     projects.forEach((project) => {
//       updatedProjects.push({
//         projectId: new ObjectId(project.projectId),
//         type: project.type,
//       });
//     });

//     // Check if a member with the given email already exists
//     const existingMember = await Member.findOne({ email: email });

//     if (existingMember) {
//       // If a member with the given email exists, check if each projectId already exists in the member's projects array
//       updatedProjects.forEach((updatedProject) => {
//         const projectAlreadyExists = existingMember.projects.some((project) =>
//           project.projectId.equals(updatedProject.projectId)
//         );

//         if (!projectAlreadyExists) {
//           existingMember.projects.push(updatedProject);
//         }
//       });

//       await existingMember.save();
//       res.status(200).json({
//         message: "Project added successfully",
//         member: existingMember,
//       });
//     } else {
//       // If a member with the given email does not exist, create a new member
//       const newMember = new Member({
//         name: name,
//         role: role,
//         email: email,
//         projects: updatedProjects,
//       });

//       // Save the new member to the database
//       const savedMember = await newMember.save();

//       // Send a success response
//       res
//         .status(201)
//         .json({ message: "Member added successfully", member: savedMember });
//     }
//   } catch (error) {
//     // Handle any errors
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

app.get("/get-members/:role", async (req, res) => {
  const roleFilter = req.params.role.replace(/[^a-zA-Z0-9]/g, "");

  try {
    let query = {};

    if (roleFilter) {
      query = { role: roleFilter };
    }

    const members = await Member.find(query);

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// app.put("/update-member/:id", async (req, res) => {
//   try {
//     const memberId = req.params.id;
//     const { projectId, type } = req.body;

//     if (
//       !mongoose.Types.ObjectId.isValid(memberId) ||
//       !mongoose.Types.ObjectId.isValid(projectId)
//     ) {
//       return res.status(400).json({ message: "Invalid member or project ID" });
//     }

//     const result = await Member.updateOne(
//       { _id: memberId, "projects.projectId": projectId },
//       { $set: { "projects.$.type": type } }
//     );

//     if (result && result.nModified > 0) {
//       return res.json({ message: "Update successful", result });
//     } else {
//       return res.json({
//         message: "No document matched the update criteria",
//         result,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

app.post("/add-update-member", async (req, res) => {
  try {
    // Extract member details from the request body
    const { name, role, email, projects } = req.body;

    // Create an array to store the updated projects
    const updatedProjects = projects.map((project) => ({
      projectId: new ObjectId(project.projectId),
      type: project.type,
    }));

    // Check if a member with the given email already exists
    const existingMember = await Member.findOne({ email: email });

    if (existingMember) {
      // If a member with the given email exists, update the projects array
      updatedProjects.forEach((updatedProject) => {
        const projectIndex = existingMember.projects.findIndex((project) =>
          project.projectId.equals(updatedProject.projectId)
        );

        if (projectIndex !== -1) {
          // Update the existing project
          existingMember.projects[projectIndex].type = updatedProject.type;
        } else {
          // Add the new project
          existingMember.projects.push(updatedProject);
        }
      });

      await existingMember.save();
      res.status(200).json({
        message: "Member updated successfully",
        member: existingMember,
      });
    } else {
      // If a member with the given email does not exist, create a new member
      const newMember = new Member({
        name: name,
        role: role,
        email: email,
        projects: updatedProjects,
      });

      // Save the new member to the database
      const savedMember = await newMember.save();

      // Send a success response
      res
        .status(201)
        .json({ message: "Member added successfully", member: savedMember });
    }
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/add-tasks", async (req, res) => {
  try {
    // Extract task details from the request body
    const { title, date, details, projectId, status, tags, members } = req.body;

    // Create a new task instance
    const newTask = new Task({
      title: title,
      date: date,
      details: details,
      projectId: projectId,
      status: status,
      tags: tags,
      members: members,
    });
    console.log(newTask);

    // Save the new task to the database
    const savedTask = await newTask.save();

    // Send a success response
    res
      .status(201)
      .json({ message: "Task created successfully", task: savedTask });
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ message: error });
  }
});

app.get("/get-tasks/:projectId", async (req, res) => {
  try {
    const projectId = new ObjectId(req.params.projectId);

    // Validate if projectId is a valid ObjectId (assuming MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Find tasks based on the projectId
    const tasks = await Task.find({ projectId: projectId });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put('/add-member-to-task/:taskId', async (req, res) => {
  const taskId = req.params.taskId;
  const { memberId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { members: memberId } }, // Use $addToSet to add memberId if it doesn't exist
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Tags to Task
app.put("/add-tags/:taskId", async (req, res) => {
  try {
    const { tags } = req.body;
    const taskId = req.params.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Remove Tags from Task
app.put("/remove-tags/:taskId", async (req, res) => {
  try {
    const { tags } = req.body;
    const taskId = req.params.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Remove Member from Task
app.put('/remove-member-from-task/:taskId', async (req, res) => {
  try {
    const { memberId } = req.body;
    const taskId = req.params.taskId;

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid task or member ID' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { members: memberId } },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

