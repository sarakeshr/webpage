import dbConnect, { Project } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await dbConnect();
      const projects = await Project.find({})
        .populate('projectManager', 'username email role')
        .populate('teamMembers', 'username email role')
        .sort({ createdAt: -1 });
      
      // Transform to match expected format
      const transformedProjects = projects.map(project => ({
        id: project._id.toString(),
        name: project.title,
        description: project.description,
        status: project.status,
        deadline: project.deadline.toISOString().split('T')[0],
        completedDate: project.status === 'Completed' ? project.updatedAt.toISOString().split('T')[0] : null,
        projectManager: project.projectManager,
        teamMembers: project.teamMembers
      }));
      
      res.status(200).json(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}