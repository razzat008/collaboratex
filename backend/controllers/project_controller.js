import Project from '../model/project.js';

export const findProject = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


export const createProject = async (req, res) => {
  try {
    const { projectName, userName, createdAt } = req.body;
    if (!projectName) return res.status(400).json({ error: "Project name is required" });

    const newProject = new Project({ userName, projectName, createdAt });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findByIdAndDelete(projectId);
    res.status(201).json({ sucess: true, message: "Deleted project sucessfully." });
  } catch (error) {
    res.status(500).json({ error: "Couldn't delete the project" });
  }
}
