import { Schema, model } from 'mongoose';

const ProjectSchema = new Schema({
  userName: { type: String, required: true },
  projectName: { type: String, required: true },
  createdAt: { type: Number, default: Date.now }, // Store timestamp using Date.now()
});

const Project = model('Project', ProjectSchema);

export default Project;
