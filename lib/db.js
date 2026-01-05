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

// Meeting Schema - Force recreate to avoid cache issues
if (mongoose.models.Meeting) {
  delete mongoose.models.Meeting;
}

const meetingSchema = new mongoose.Schema({
  projectId: { type: String, required: true }, // Changed from Number to String
  title: { type: String, required: true },
  timestamp: { type: Number, required: true }, // Unix timestamp for date/time
  duration: { type: String, default: '30' },
  purpose: { type: String, required: false },
  location: { type: String, default: 'Online meet' },
  participants: [String],
  hostId: { type: String, required: true }, // Meeting host/creator
  roomName: { type: String }, // Remove unique constraint temporarily
  moderators: [String], // Array of moderator user IDs
  hostJoined: { type: Boolean, default: false }, // Track if host has joined
  createdAt: { type: Date, default: Date.now }
});

export const Meeting = mongoose.model('Meeting', meetingSchema);

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

// Board Column Schema
const boardColumnSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  color: { type: String, default: '#007bff' },
  createdAt: { type: Date, default: Date.now }
});

export const BoardColumn = mongoose.models.BoardColumn || mongoose.model('BoardColumn', boardColumnSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoardColumn', required: true },
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // For subtasks
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  dueDate: { type: Date },
  tags: [String],
  subtasks: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    isHeading: { type: Boolean, default: false },
    parentHeading: { type: String }
  }],
  completed: { type: Boolean, default: false }, // For subtasks
  progress: { type: Number, default: 0 }, // For parent tasks
  attachments: {
    type: [{
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      size: { type: Number, required: true },
      mimetype: { type: String, required: true },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: [],
    validate: {
      validator: function(attachments) {
        const totalSize = attachments.reduce((sum, file) => sum + file.size, 0);
        return totalSize <= 5 * 1024 * 1024 * 1024; // 5GB limit
      },
      message: 'Total attachment size cannot exceed 5GB'
    }
  },
  comments: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    author: {
      id: { type: String, required: true },
      username: { type: String, required: true }
    },
    mentions: [{
      id: { type: String, required: true },
      username: { type: String, required: true }
    }],
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  }],
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// Priority Schema
const prioritySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#007bff' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Priority = mongoose.models.Priority || mongoose.model('Priority', prioritySchema);

// Tag Schema
const tagSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#6c757d' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema);

// Checklist Schema
const checklistSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  dueDate: { type: Date },
  tags: [String],
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Checklist = mongoose.models.Checklist || mongoose.model('Checklist', checklistSchema);

export const rolePermissions = {
  client: ['view_projects', 'view_boards', 'comment_tasks'],
  director: ['view_all', 'view_projects', 'view_boards', 'comment_tasks'],
  project_manager: ['view_projects', 'manage_projects', 'assign_tasks', 'view_boards', 'manage_boards', 'comment_tasks'],
  developer: ['view_tasks', 'view_code', 'view_boards', 'comment_tasks'],
  tester: ['view_tasks', 'test_projects', 'report_bugs', 'view_boards', 'comment_tasks'],
  crm: ['view_clients', 'manage_clients', 'view_projects', 'view_boards', 'comment_tasks'],
  admin: ['manage_all', 'create_projects', 'manage_users', 'view_all', 'view_boards', 'comment_tasks']
};



export default dbConnect;