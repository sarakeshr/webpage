import dbConnect, { Task } from '../../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { id } = req.body;
      
      const restoredTask = await Task.findByIdAndUpdate(id, {
        deleted: false,
        deletedAt: null,
        deletedBy: null
      }, { new: true }).populate('assignee', 'username email');
      
      if (!restoredTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.status(200).json({ message: 'Task restored successfully', task: restoredTask });
    } catch (error) {
      console.error('Error restoring task:', error);
      res.status(500).json({ error: 'Failed to restore task' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}