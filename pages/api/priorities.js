import dbConnect, { Priority } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      let priorities = await Priority.find({ projectId }).sort({ order: 1 }).lean();
      
      // If no custom priorities exist, create default ones
      if (priorities.length === 0) {
        const defaultPriorities = [
          { projectId, name: 'Low', color: '#48dbfb', order: 0 },
          { projectId, name: 'Medium', color: '#feca57', order: 1 },
          { projectId, name: 'High', color: '#ff6b6b', order: 2 },
          { projectId, name: 'Critical', color: '#8b0000', order: 3 }
        ];
        
        priorities = await Priority.insertMany(defaultPriorities);
      }
      
      res.status(200).json(priorities);
    } catch (error) {
      console.error('Error fetching priorities:', error);
      res.status(500).json({ error: 'Failed to fetch priorities' });
    }
  } else if (req.method === 'POST') {
    try {
      const { projectId, name, color, userRole } = req.body;
      
      // Only admin can create custom priorities
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admin can create custom priorities' });
      }
      
      const lastPriority = await Priority.findOne({ projectId }).sort({ order: -1 });
      const order = lastPriority ? lastPriority.order + 1 : 0;
      
      const newPriority = new Priority({
        projectId,
        name,
        color: color || '#007bff',
        order
      });
      
      const savedPriority = await newPriority.save();
      res.status(201).json(savedPriority);
    } catch (error) {
      console.error('Error creating priority:', error);
      res.status(500).json({ error: 'Failed to create priority' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}