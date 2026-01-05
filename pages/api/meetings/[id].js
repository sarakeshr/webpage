import dbConnect, { Meeting } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await dbConnect();
      const result = await Meeting.findByIdAndDelete(id);
      
      if (result) {
        console.log(`✅ Deleted meeting: ${id}`);
        res.status(200).json({ message: 'Meeting deleted successfully', id });
      } else {
        console.log(`❌ Meeting not found: ${id}`);
        res.status(404).json({ message: 'Meeting not found', id });
      }
    } catch (error) {
      console.error(`❌ Error deleting meeting ${id}:`, error);
      res.status(500).json({ message: 'Error deleting meeting', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}