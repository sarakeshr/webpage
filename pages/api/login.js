import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect, { User } from '../../lib/db';

const JWT_SECRET = 'your-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful', role: user.role, permissions: user.permissions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}