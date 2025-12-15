import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Handle admin user
    if (decoded.userId === 'admin') {
      return res.status(200).json({
        id: 'admin',
        _id: 'admin',
        username: 'admin',
        name: 'Administrator',
        email: 'admin@priam.com',
        role: 'admin'
      });
    }
    
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: decoded.userId },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}