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
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }
    res.status(200).json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ success: false, message: "Failed to delete the project.", error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId, modified_time } = req.body;
    const project = await Project.findByIdAndUpdate(projectId, {
      lastModified: modified_time,
    }, { new: true });
    res.status(201).json({ success: true, message: "Deleted project sucessfully." });
  } catch (error) {
    res.status(500).json({ error: "Couldn't delete the project" });
  }
}
