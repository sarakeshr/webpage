import dbConnect, { BoardColumn } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const columns = await BoardColumn.find({ projectId }).sort({ order: 1 }).lean();
      
      // If no columns exist, create default ones
      if (columns.length === 0) {
        const defaultColumns = [
          { projectId, name: 'To Do', order: 0, color: '#6c757d' },
          { projectId, name: 'In Progress', order: 1, color: '#007bff' },
          { projectId, name: 'Done', order: 2, color: '#28a745' }
        ];
        
        const createdColumns = await BoardColumn.insertMany(defaultColumns);
        return res.status(200).json(createdColumns);
      }
      
      res.status(200).json(columns);
    } catch (error) {
      console.error('Error fetching board columns:', error);
      res.status(500).json({ error: 'Failed to fetch board columns' });
    }
  } else if (req.method === 'POST') {
    try {
      const { projectId, name, color, userRole } = req.body;
      
      // Check permissions
      if (userRole !== 'admin' && userRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      // Get the highest order number
      const lastColumn = await BoardColumn.findOne({ projectId }).sort({ order: -1 });
      const order = lastColumn ? lastColumn.order + 1 : 0;
      
      const newColumn = new BoardColumn({
        projectId,
        name,
        order,
        color: color || '#007bff'
      });
      
      const savedColumn = await newColumn.save();
      res.status(201).json(savedColumn);
    } catch (error) {
      console.error('Error creating board column:', error);
      res.status(500).json({ error: 'Failed to create board column' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, color, userRole } = req.body;
      
      // Check permissions
      if (userRole !== 'admin' && userRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const updatedColumn = await BoardColumn.findByIdAndUpdate(
        id,
        { name, color },
        { new: true }
      );
      
      if (!updatedColumn) {
        return res.status(404).json({ error: 'Column not found' });
      }
      
      res.status(200).json(updatedColumn);
    } catch (error) {
      console.error('Error updating board column:', error);
      res.status(500).json({ error: 'Failed to update board column' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id, userRole } = req.body;
      
      // Check permissions
      if (userRole !== 'admin' && userRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const deletedColumn = await BoardColumn.findByIdAndDelete(id);
      
      if (!deletedColumn) {
        return res.status(404).json({ error: 'Column not found' });
      }
      
      res.status(200).json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Error deleting board column:', error);
      res.status(500).json({ error: 'Failed to delete board column' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}