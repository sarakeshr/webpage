import dbConnect, { Checklist, Task } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { taskId } = req.query;
      
      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const checklists = await Checklist.find({ 
        taskId, 
        deleted: { $ne: true } 
      })
      .populate('assignee', 'username email')
      .sort({ order: 1 })
      .lean();
      
      res.status(200).json(checklists);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      res.status(500).json({ error: 'Failed to fetch checklists' });
    }
  } else if (req.method === 'POST') {
    try {
      const { taskId, projectId, title, description, assignee, priority, dueDate, tags, createdBy } = req.body;
      
      // Get the highest order number for this task
      const lastChecklist = await Checklist.findOne({ taskId }).sort({ order: -1 });
      const order = lastChecklist ? lastChecklist.order + 1 : 0;
      
      const checklistData = {
        taskId,
        projectId,
        title,
        description: description || '',
        assignee: assignee || null,
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        tags: tags || [],
        order,
        createdBy
      };
      
      const newChecklist = new Checklist(checklistData);
      const savedChecklist = await newChecklist.save();
      
      const populatedChecklist = await Checklist.findById(savedChecklist._id)
        .populate('assignee', 'username email');
      
      res.status(201).json(populatedChecklist);
    } catch (error) {
      console.error('Error creating checklist:', error);
      res.status(500).json({ error: 'Failed to create checklist' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, title, description, assignee, priority, dueDate, tags, completed } = req.body;
      
      const updateData = {
        updatedAt: new Date()
      };
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (assignee !== undefined) updateData.assignee = assignee || null;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate || null;
      if (tags !== undefined) updateData.tags = tags;
      if (completed !== undefined) updateData.completed = completed;
      
      const updatedChecklist = await Checklist.findByIdAndUpdate(id, updateData, { new: true })
        .populate('assignee', 'username email');
      
      if (!updatedChecklist) {
        return res.status(404).json({ error: 'Checklist not found' });
      }
      
      res.status(200).json(updatedChecklist);
    } catch (error) {
      console.error('Error updating checklist:', error);
      res.status(500).json({ error: 'Failed to update checklist' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id, permanent } = req.body;
      
      if (permanent) {
        const deletedChecklist = await Checklist.findByIdAndDelete(id);
        if (!deletedChecklist) {
          return res.status(404).json({ error: 'Checklist not found' });
        }
        res.status(200).json({ message: 'Checklist permanently deleted' });
      } else {
        const updatedChecklist = await Checklist.findByIdAndUpdate(id, {
          deleted: true,
          deletedAt: new Date()
        }, { new: true });
        
        if (!updatedChecklist) {
          return res.status(404).json({ error: 'Checklist not found' });
        }
        
        res.status(200).json({ message: 'Checklist moved to trash' });
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      res.status(500).json({ error: 'Failed to delete checklist' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}