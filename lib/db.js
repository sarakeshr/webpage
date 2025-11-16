import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://sarakesh51_db_user:IlmVuAj9vVx6pWJq@cluster0.3wfrjr5.mongodb.net/?appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['client', 'director', 'project_manager', 'developer', 'tester', 'crm'] },
  permissions: [String]
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

// Meeting Schema
const meetingSchema = new mongoose.Schema({
  projectId: { type: Number, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  participants: [String], // Array of user IDs
  createdAt: { type: Date, default: Date.now }
});

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

export const rolePermissions = {
  client: ['view_projects'],
  director: ['view_all', 'manage_all', 'create_projects', 'assign_teams'],
  project_manager: ['view_projects', 'manage_projects', 'assign_tasks'],
  developer: ['view_tasks', 'update_tasks', 'view_code'],
  tester: ['view_tasks', 'test_projects', 'report_bugs'],
  crm: ['view_clients', 'manage_clients', 'view_projects']
};

// Create default users
export async function createDefaultUsers() {
  const defaultUsers = [
    { username: 'client1', password: 'client123', role: 'client' },
    { username: 'director1', password: 'director123', role: 'director' },
    { username: 'pm1', password: 'pm123', role: 'project_manager' },
    { username: 'dev1', password: 'dev123', role: 'developer' },
    { username: 'tester1', password: 'test123', role: 'tester' },
    { username: 'crm1', password: 'crm123', role: 'crm' }
  ];

  for (const userData of defaultUsers) {
    const existingUser = await User.findOne({ username: userData.username });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        permissions: rolePermissions[userData.role]
      });
      await user.save();
    }
  }
}

export default dbConnect;