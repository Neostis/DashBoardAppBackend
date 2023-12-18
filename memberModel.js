const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");

const projectSchema = new mongoose.Schema(
  {
    projectId: String,
    type: String,
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
<<<<<<< HEAD
  projects: [
    {
      projectID: { type: ObjectId, required: true },
      type: { type: String, required: true },
    },
 ],
=======
  projects: [projectSchema],
>>>>>>> 794e421d29d7e11a58363191e05bee321a9db3de
});

const Member = mongoose.model('TestMembers', memberSchema); // Specify 'TestMembers' as the collection name
module.exports = Member;
