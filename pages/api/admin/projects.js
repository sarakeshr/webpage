import dbConnect, { Project, User } from '../../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const projects = await Project.find({})
        .populate('projectManager', 'username email role')
        .populate('teamMembers', 'username email role')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });
      
      res.status(200).json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, startDate, deadline, status, projectManager, teamMembers, createdBy } = req.body;
      
      console.log('Received data:', { title, description, startDate, deadline, status, projectManager, teamMembers, createdBy });
      
      // Validate required fields
      if (!title || !description || !startDate || !deadline || !status || !projectManager) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate ObjectId format for projectManager
      if (!projectManager.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid project manager ID format' });
      }
      
      const projectData = {
        title,
        description,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        status,
        projectManager,
        teamMembers: teamMembers || []
      };
      
      // Only add createdBy if it's a valid ObjectId
      if (createdBy && createdBy.match(/^[0-9a-fA-F]{24}$/)) {
        projectData.createdBy = createdBy;
      }
      
      console.log('Creating project with data:', projectData);
      
      const newProject = new Project(projectData);
      const savedProject = await newProject.save();
      
      console.log('Project saved successfully:', savedProject._id);
      
      const populatedProject = await Project.findById(savedProject._id)
        .populate('projectManager', 'username email role')
        .populate('teamMembers', 'username email role')
        .populate('createdBy', 'username email');
      
      res.status(201).json(populatedProject);
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error details:', error.message);
      res.status(500).json({ error: 'Failed to create project', details: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.deadline) updateData.deadline = new Date(updateData.deadline);
      updateData.updatedAt = new Date();
      
      const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true })
        .populate('projectManager', 'username email role')
        .populate('teamMembers', 'username email role')
        .populate('createdBy', 'username email');
      
      res.status(200).json(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await Project.findByIdAndDelete(id);
      res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}