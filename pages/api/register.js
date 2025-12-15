import bcrypt from 'bcryptjs';
import dbConnect, { User, rolePermissions } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { username, email, password, role, secretKey } = req.body;
    
    if (secretKey !== '1234') {
      return res.status(401).json({ error: 'Invalid secret key' });
    }
    
    if (!rolePermissions[role]) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username,
      email, 
      password: hashedPassword, 
      role,
      permissions: rolePermissions[role]
    });
    
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    } else {
      res.status(400).json({ error: 'Registration failed' });
    }
  }
}