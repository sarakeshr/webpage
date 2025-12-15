import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { databaseName, confirm } = req.body;

  if (!confirm || confirm !== 'DELETE_CONFIRMED') {
    return res.status(400).json({ message: 'Confirmation required' });
  }

  if (databaseName !== 'meetingapp') {
    return res.status(400).json({ message: 'Invalid database name' });
  }

  try {
    // Connect to the meetingapp database
    const meetingappUri = 'mongodb+srv://sarakesh51_db_user:Santhosh05@cluster0.3wfrjr5.mongodb.net/meetingapp?retryWrites=true&w=majority&appName=Cluster0';
    
    const connection = await mongoose.createConnection(meetingappUri);
    
    // Drop the entire database
    await connection.dropDatabase();
    
    console.log('✅ meetingapp database deleted successfully');
    
    await connection.close();
    
    res.status(200).json({ 
      message: 'Database deleted successfully',
      deletedDatabase: 'meetingapp'
    });
  } catch (error) {
    console.error('❌ Error deleting database:', error);
    res.status(500).json({ 
      error: 'Failed to delete database', 
      details: error.message 
    });
  }
}