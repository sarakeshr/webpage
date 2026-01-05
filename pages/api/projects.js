import dbConnect, { Project } from '../../lib/db';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { userId, userRole } = req.query;
      console.log('Projects API - userId:', userId, 'userRole:', userRole);
      
      // If no userId or userRole provided, return empty array
      if (!userId || !userRole) {
        console.log('No userId or userRole provided, returning empty array');
        return res.status(200).json([]);
      }
      
      let projects;
      
      if (userRole === 'admin') {
        // Only admin sees all projects
        projects = await Project.find({}).populate('projectManager', 'username email').populate('teamMembers', 'username email role').lean();
        console.log('Admin - Found projects:', projects.length);
      } else if (userRole === 'project_manager') {
        // Convert userId to ObjectId if it's a valid ObjectId string
        const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        projects = await Project.find({ projectManager: objectId }).populate('projectManager', 'username email').populate('teamMembers', 'username email role').lean();
        console.log('Project Manager - Found projects:', projects.length, 'for userId:', userId, 'objectId:', objectId);
      } else if (userRole === 'director') {
        // Directors see all projects
        projects = await Project.find({}).populate('projectManager', 'username email').populate('teamMembers', 'username email role').lean();
        console.log('Director - Found projects:', projects.length);
      } else {
        // Team members (developer, tester, crm) see only assigned projects
        const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        projects = await Project.find({ teamMembers: objectId }).populate('projectManager', 'username email').populate('teamMembers', 'username email role').lean();
        console.log('Team Member (' + userRole + ') - Found projects:', projects.length, 'for userId:', userId, 'objectId:', objectId);
        
        // Debug: Check all projects and their team members
        const allProjects = await Project.find({}).populate('teamMembers', 'username email role').lean();
        console.log('All projects with team members:');
        allProjects.forEach(p => {
          console.log(`Project: ${p.title}, Team Members:`, p.teamMembers?.map(tm => ({ id: tm._id.toString(), name: tm.username })));
        });
      }
      
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  } else if (req.method === 'POST') {
    try {
      const project = new Project(req.body);
      const savedProject = await project.save();
      res.status(201).json(savedProject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}