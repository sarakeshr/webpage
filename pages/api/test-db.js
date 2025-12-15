import dbConnect from '../../lib/db';

export default async function handler(req, res) {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await dbConnect();
    console.log('✅ Database connected successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      uri: process.env.MONGODB_URI ? 'URI is set' : 'URI missing'
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}