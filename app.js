const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const mime = require("mime-types");

const { ObjectId } = require("mongodb");
const multer = require("multer");
const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({ storage: storage });

const Member = require("./memberModel");
const Task = require("./taskModel");
const Payment = require("./paymentModel");
const Timeline = require("./timelineModel");
const memberModel = require("./memberModel");

const app = express();
app.use(cors());

const bodyParser = require("body-parser");
const Project = require("./projectModel");
const Timeline = require("./timelineModel");
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/files", express.static("files"));

let db;
// MongoDB connection
const mongoUrl =
  "mongodb+srv://admin:admin@cluster0.5wtjno2.mongodb.net/a?retryWrites=true&w=majority";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    db = mongoose.connection.db;
    // res.status(200).send("Connected to database");
  })
  .catch((e) => {
    console.error("MongoDB connection error:", e);
    // res.status(500).send("Internal Server Error");
  });
mongoose.connection.once("open", () => {
  db = mongoose.connection.db;
});
// Check if connection establish
mongoose.connection.once("open", () => {
  db = mongoose.connection.db;
});

// connectMongo = () => {
//   mongoose
//     .connect(mongoUrl, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     })
//     .then(() => {
//       db = mongoose.connection.db;
//       res.status(200).send("Connected to database");
//     })
//     .catch((e) => {
//       console.error("MongoDB connection error:", error);
//       res.status(500).send("Internal Server Error");
//     });
//   mongoose.connection.once("open", () => {
//     db = mongoose.connection.db;
//   });
// };

app.get("/", (req, res) => {
  /* mongoose
    .connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      db = mongoose.connection.db;
      res.status(200).send("Connected to database");
    })
    .catch((e) => {
      console.error("MongoDB connection error:", error);
      res.status(500).send("Internal Server Error");
    });
  mongoose.connection.once("open", () => {
    db = mongoose.connection.db;
  });*/
  res.send("welcome");
});

app.get("/get-files", async (req, res) => {
  const filesCollection = db.collection("fs.files");

  try {
    // Retrieve all files from fs.files
    const allFiles = await filesCollection.find().toArray();

    res.json(allFiles);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.get("/get-file/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const bucket = new mongoose.mongo.GridFSBucket(db);

    const fileMetadata = await bucket.find({ _id: ObjectId(fileId) }).toArray();

    if (fileMetadata.length === 0) {
      return res.status(404).json({ error: "File does not exist." });
    }

    const contentType =
      mime.lookup(fileMetadata[0].contentType) || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    bucket.openDownloadStream(ObjectId(fileId)).pipe(res);
  } catch (error) {
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
        res.status(201);
      });
    } catch (error) {
      res.json({ status: "Internal Server Error" });
    }
  }
);

app.get("/get-projects", async (req, res) => {
  const projectsCollection = db.collection("Projects");

  try {
    // Retrieve all files from fs.files
    const allProject = await projectsCollection.find().toArray();

    res.status(200).json(allProject);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add-project/:title", async (req, res) => {
  try {
    const title = req.params.title;

    const newProject = new Project({
      title: title,
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).send("Internal Server Error");
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

    res.status(204).json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
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

    res.status(200).json(filterMembers);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
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

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/get-members/:role", async (req, res) => {
  const roleFilter = req.params.role.replace(/[^a-zA-Z0-9]/g, "");

  try {
    let query = {};

    if (roleFilter) {
      query = { role: roleFilter };
    }

    const members = await Member.find(query);

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

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
      res.status(201).json({
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

    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/add-tasks", async (req, res) => {
  try {
    // Extract task details from the request body
    const {
      title,
      startDate,
      endDate,
      details,
      projectId,
      status,
      tags,
      members,
    } = req.body;

    // Create a new task instance
    const newTask = new Task({
      title: title,
      startDate: startDate,
      endDate: endDate,
      details: details,
      projectId: projectId,
      status: status,
      tags: tags,
      members: members,
    });

    const newTimeline = new Timeline({
      label: title,
      taskId: newTask._id,
      projectId: projectId,
      connections: [],
      dateStart: startDate,
      dateEnd: endDate,
      type: "task",
    });

    // Save the new task to the database
    const savedTask = await newTask.save();
    const savedTimeline = await newTimeline.save();

    // Send a success response
    res
      .status(201)
      .json({ message: "Task created successfully", task: savedTask });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
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

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/add-member-to-task/:taskId", async (req, res) => {
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

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/add-tags/:taskId", async (req, res) => {
  try {
    const { tags } = req.body;
    const taskId = req.params.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/remove-tags/:taskId", async (req, res) => {
  try {
    const { tags } = req.body;
    const taskId = req.params.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/remove-member-from-task/:taskId", async (req, res) => {
  try {
    const { memberId } = req.body;
    const taskId = req.params.taskId;

    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return res.status(400).json({ message: "Invalid task or member ID" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { members: memberId } },
      { new: true }
    );

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/update-task-status/:taskId", async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.taskId;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: status } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(201).json({
      message: "Task status updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/get-timelines/:projectId", async (req, res) => {
  try {
    const projectId = new ObjectId(req.params.projectId);

    // Validate if projectId is a valid ObjectId (assuming MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Find tasks based on the projectId
    const tasks = await Timeline.find({ projectId: projectId });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// app.put("/update-timelines", async (req, res) => {
//   try {
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

app.post("/update-payment", async (req, res) => {
  try {
    const { projectId, usage, note, budget, change, notification } = req.body;

    // Check if the projectId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Check if the project already has a payment
    const existingPayment = await Payment.findOne({
      projectId: ObjectId(projectId),
    });

    if (existingPayment) {
      // If a payment exists, update it
      existingPayment.usage = usage;
      existingPayment.note = note;
      existingPayment.budget = budget;
      existingPayment.change = change;
      existingPayment.notification = notification;

      const updatedPayment = await existingPayment.save();

      res.status(200).json({
        message: "Payment updated successfully",
      });
    } else {
      // If no payment exists, create a new one
      const newPayment = new Payment({
        projectId: ObjectId(projectId),
        usage: usage,
        note: note,
        budget: budget,
        change: change,
        notification: notification,
      });

      const savedPayment = await newPayment.save();

      res.status(201).json({
        message: "Payment created successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/get-payments/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check if the projectId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Find payments for the specified project
    const payments = await Payment.find({ projectId: ObjectId(projectId) });

    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("Server Started");
});

module.exports = app;
