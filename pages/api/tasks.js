import dbConnect, { Task, BoardColumn } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { projectId, deleted } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const filter = { projectId };
      if (deleted === 'true') {
        filter.deleted = true;
      } else {
        filter.deleted = { $ne: true };
      }

      // Ensure all tasks have subtasks field (migration)
      await Task.updateMany(
        { subtasks: { $exists: false } },
        { $set: { subtasks: [] } }
      );
      
      const tasks = await Task.find(filter)
        .populate('assignee', 'username email')
        .sort({ order: 1 })
        .lean();
      
      // Ensure subtasks field exists for all tasks
      const tasksWithSubtasks = tasks.map(task => ({
        ...task,
        subtasks: task.subtasks || []
      }));
      
      console.log('Fetched tasks with subtasks:', tasksWithSubtasks.map(t => ({id: t._id, title: t.title, subtasks: t.subtasks})));
      
      res.status(200).json(tasksWithSubtasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  } else if (req.method === 'POST') {
    try {
      const { projectId, columnId, title, description, assignee, priority, dueDate, tags, subtasks, createdBy } = req.body;
      
      // Get the highest order number in the column
      const lastTask = await Task.findOne({ columnId }).sort({ order: -1 });
      const order = lastTask ? lastTask.order + 1 : 0;
      
      console.log('=== TASK CREATION DEBUG ===');
      console.log('Received subtasks:', JSON.stringify(subtasks, null, 2));
      console.log('Subtasks type:', typeof subtasks);
      console.log('Subtasks is array:', Array.isArray(subtasks));
      
      const taskData = {
        projectId,
        columnId,
        title,
        description: description || '',
        assignee: assignee || null,
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        tags: tags || [],
        subtasks: subtasks || [],
        order,
        createdBy
      };
      
      console.log('Task data subtasks:', JSON.stringify(taskData.subtasks, null, 2));
      
      const newTask = new Task(taskData);
      console.log('Mongoose task subtasks before save:', JSON.stringify(newTask.subtasks, null, 2));
      console.log('Mongoose task toObject:', JSON.stringify(newTask.toObject(), null, 2));
      
      const savedTask = await newTask.save();
      console.log('Saved task subtasks:', JSON.stringify(savedTask.subtasks, null, 2));
      console.log('Saved task full object:', JSON.stringify(savedTask.toObject(), null, 2));
      const populatedTask = await Task.findById(savedTask._id)
        .populate('assignee', 'username email');
      
      console.log('Populated task subtasks:', populatedTask.subtasks);
      res.status(201).json(populatedTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, taskId, title, description, assignee, priority, dueDate, tags, subtasks, columnId } = req.body;
      const targetId = taskId || id;
      
      const updateData = {
        title,
        description,
        assignee: assignee || null,
        priority,
        dueDate: dueDate || null,
        tags: tags || [],
        subtasks: subtasks || [],
        updatedAt: new Date()
      };
      
      // If moving to different column, update order
      if (columnId) {
        const lastTask = await Task.findOne({ columnId }).sort({ order: -1 });
        updateData.columnId = columnId;
        updateData.order = lastTask ? lastTask.order + 1 : 0;
      }
      
      const updatedTask = await Task.findByIdAndUpdate(targetId, updateData, { new: true })
        .populate('assignee', 'username email');
      
      console.log('Updated task subtasks:', updatedTask.subtasks);
      
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id, soft, permanent } = req.body;
      
      if (permanent) {
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task permanently deleted' });
      } else {
        console.log('Soft deleting task:', id);
        const updatedTask = await Task.findByIdAndUpdate(id, {
          deleted: true,
          deletedAt: new Date()
        }, { new: true });
        
        console.log('Updated task:', updatedTask);
        
        if (!updatedTask) {
          return res.status(404).json({ error: 'Task not found' });
        }
        
        res.status(200).json({ message: 'Task moved to trash', task: updatedTask });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}