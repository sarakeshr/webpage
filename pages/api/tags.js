import dbConnect, { Tag } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const tags = await Tag.find({ projectId }).sort({ order: 1 }).lean();
      res.status(200).json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  } else if (req.method === 'POST') {
    try {
      const { projectId, name, color } = req.body;
      
      const lastTag = await Tag.findOne({ projectId }).sort({ order: -1 });
      const order = lastTag ? lastTag.order + 1 : 0;
      
      const newTag = new Tag({
        projectId,
        name,
        color: color || '#6c757d',
        order
      });
      
      const savedTag = await newTag.save();
      res.status(201).json(savedTag);
    } catch (error) {
      console.error('Error creating tag:', error);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, color } = req.body;
      
      const updatedTag = await Tag.findByIdAndUpdate(
        id,
        { name, color },
        { new: true }
      );
      
      if (!updatedTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      res.status(200).json(updatedTag);
    } catch (error) {
      console.error('Error updating tag:', error);
      res.status(500).json({ error: 'Failed to update tag' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      
      const deletedTag = await Tag.findByIdAndDelete(id);
      
      if (!deletedTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}