import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect, { User } from '../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { username, email, password } = req.body;
    
    // Hardcoded admin credentials
    if ((username === 'admin' || email === 'admin@priam.com') && password === 'admin123') {
      const token = jwt.sign({ userId: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      const adminUser = { username: 'admin', email: 'admin@priam.com', role: 'admin' };
      return res.json({ 
        token, 
        message: 'Login successful', 
        role: 'admin', 
        permissions: ['manage_all'], 
        email: 'admin@priam.com',
        user: adminUser
      });
    }
    
    const user = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const userData = {
      id: user._id,
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      role: user.role
    };
    res.json({ 
      token, 
      message: 'Login successful', 
      role: user.role, 
      permissions: user.permissions, 
      email: user.email,
      user: userData
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}