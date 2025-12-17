import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

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
  role: { type: String, required: true, enum: ['client', 'director', 'project_manager', 'developer', 'tester', 'crm', 'admin'] },
  permissions: [String]
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

// Meeting Schema
const meetingSchema = new mongoose.Schema({
  projectId: { type: Number, required: true },
  title: { type: String, required: true },
  timestamp: { type: Number, required: true }, // Unix timestamp for date/time
  duration: { type: String, default: '30' },
  purpose: { type: String, required: false },
  location: { type: String, default: 'Online meet' },
  participants: [String],
  hostId: { type: String, required: true }, // Meeting host/creator
  roomName: { type: String, unique: true }, // Jitsi room name
  moderators: [String], // Array of moderator user IDs
  hostJoined: { type: Boolean, default: false }, // Track if host has joined
  createdAt: { type: Date, default: Date.now }
});

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Planning', 'In Progress', 'Testing', 'Completed'] },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export const rolePermissions = {
  client: ['view_projects'],
  director: ['view_all', 'manage_all', 'create_projects', 'assign_teams'],
  project_manager: ['view_projects', 'manage_projects', 'assign_tasks'],
  developer: ['view_tasks', 'update_tasks', 'view_code'],
  tester: ['view_tasks', 'test_projects', 'report_bugs'],
  crm: ['view_clients', 'manage_clients', 'view_projects'],
  admin: ['manage_all', 'create_projects', 'manage_users', 'view_all']
};



export default dbConnect;