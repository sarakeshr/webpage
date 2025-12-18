import dbConnect, { Project, User } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { projectId, userId, action, requesterId, requesterRole } = req.body;
      
      // Check permissions - only admin and project_manager can modify team members
      if (requesterRole !== 'admin' && requesterRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // If requester is project_manager, verify they manage this project
      if (requesterRole === 'project_manager' && project.projectManager.toString() !== requesterId) {
        return res.status(403).json({ error: 'Not authorized for this project' });
      }

      if (action === 'add') {
        if (!project.teamMembers.includes(userId)) {
          project.teamMembers.push(userId);
          await project.save();
        }
      } else if (action === 'remove') {
        project.teamMembers = project.teamMembers.filter(id => id.toString() !== userId);
        await project.save();
      }

      const updatedProject = await Project.findById(projectId).populate('teamMembers', 'username email role');
      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update team members' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}