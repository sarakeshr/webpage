import dbConnect, { Meeting } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      await dbConnect();
      
      const updatedMeeting = await Meeting.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );

      if (!updatedMeeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      console.log('✅ Meeting updated:', updatedMeeting._id);
      res.status(200).json(updatedMeeting);
    } catch (error) {
      console.error('Database error in PUT:', error);
      res.status(500).json({ error: 'Failed to update meeting' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await dbConnect();
      
      const deletedMeeting = await Meeting.findByIdAndDelete(id);

      if (!deletedMeeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      console.log('✅ Meeting deleted:', id);
      res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
      console.error('Database error in DELETE:', error);
      res.status(500).json({ error: 'Failed to delete meeting' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}