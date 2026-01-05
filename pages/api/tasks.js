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
      const { projectId, columnId, title, description, assignee, priority, dueDate, tags, subtasks, createdBy, attachments } = req.body;
      
      // Get the highest order number in the column
      const lastTask = await Task.findOne({ columnId }).sort({ order: -1 });
      const order = lastTask ? lastTask.order + 1 : 0;
      
      console.log('=== TASK CREATION DEBUG ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('Received subtasks:', JSON.stringify(subtasks, null, 2));
      console.log('Received attachments:', JSON.stringify(attachments, null, 2));
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
        attachments: attachments || [],
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
      const { id, taskId, title, description, assignee, priority, dueDate, tags, subtasks, columnId, attachments } = req.body;
      const targetId = taskId || id;
      
      console.log('PUT request body:', JSON.stringify(req.body, null, 2));
      console.log('Request keys:', Object.keys(req.body));
      console.log('Target ID:', targetId);
      
      if (!targetId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      // If this is a drag-and-drop move (only taskId and columnId provided)
      if (columnId && !title && !description && !priority && !dueDate && !tags && !subtasks && !attachments) {
        console.log('Detected drag-and-drop move, preserving all data');
        const lastTask = await Task.findOne({ columnId }).sort({ order: -1 });
        const updateData = {
          columnId,
          order: lastTask ? lastTask.order + 1 : 0,
          updatedAt: new Date()
        };
        
        const updatedTask = await Task.findByIdAndUpdate(targetId, updateData, { new: true })
          .populate('assignee', 'username email');
        
        if (!updatedTask) {
          return res.status(404).json({ error: 'Task not found' });
        }
        
        console.log('Drag-and-drop update successful, preserved data:', {
          tags: updatedTask.tags,
          subtasks: updatedTask.subtasks,
          attachments: updatedTask.attachments
        });
        
        res.status(200).json(updatedTask);
      } else {
        console.log('Full task update detected');
        console.log('Received data:', { title, description, assignee, priority, dueDate, tags, subtasks, attachments });
        console.log('Subtasks received:', JSON.stringify(subtasks, null, 2));
        console.log('Subtasks type:', typeof subtasks);
        console.log('Subtasks is array:', Array.isArray(subtasks));
        
        // Validate required fields
        if (!title || title.trim() === '') {
          return res.status(400).json({ error: 'Task title is required' });
        }
        
        // Full task update - only update fields that are provided
        const updateData = {
          updatedAt: new Date()
        };
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assignee !== undefined) updateData.assignee = assignee || null;
        if (priority !== undefined) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate || null;
        if (tags !== undefined) updateData.tags = tags;
        if (subtasks !== undefined) {
          console.log('Setting subtasks in updateData:', JSON.stringify(subtasks, null, 2));
          updateData.subtasks = subtasks;
        } else {
          console.log('Subtasks is undefined, not updating subtasks field');
        }
        if (attachments !== undefined) updateData.attachments = attachments;
        
        console.log('Update data being sent to DB:', JSON.stringify(updateData, null, 2));
        console.log('Subtasks in updateData:', JSON.stringify(updateData.subtasks, null, 2));
        
        // If moving to different column, update order
        if (columnId) {
          const lastTask = await Task.findOne({ columnId }).sort({ order: -1 });
          updateData.columnId = columnId;
          updateData.order = lastTask ? lastTask.order + 1 : 0;
        }
        
        const updatedTask = await Task.findByIdAndUpdate(targetId, updateData, { new: true })
          .populate('assignee', 'username email');
        
        console.log('Updated task subtasks:', updatedTask?.subtasks);
        
        if (!updatedTask) {
          console.log('Task not found with ID:', targetId);
          return res.status(404).json({ error: 'Task not found' });
        }
        
        console.log('Task update successful');
        res.status(200).json(updatedTask);
      }
    } catch (error) {
      console.error('Detailed error updating task:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to update task', details: error.message });
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