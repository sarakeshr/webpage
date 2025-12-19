import dbConnect, { BoardColumn } from '../../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { projectId, columnOrder, userRole } = req.body;
      
      // Check permissions
      if (userRole !== 'admin' && userRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      // Update order for each column
      const updatePromises = columnOrder.map(({ id, order }) => 
        BoardColumn.findByIdAndUpdate(id, { order }, { new: true })
      );
      
      await Promise.all(updatePromises);
      
      res.status(200).json({ message: 'Columns reordered successfully' });
    } catch (error) {
      console.error('Error reordering columns:', error);
      res.status(500).json({ error: 'Failed to reorder columns' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}