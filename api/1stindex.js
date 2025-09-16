const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join('/tmp', 'uploads', 'assignments');
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF, DOC, DOCX, TXT, and ZIP files are allowed!');
    }
  }
});

// Schemas
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseCode: { type: String, required: true },
  description: { type: String },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  fileName: { type: String },
  filePath: { type: String },
  originalName: { type: String },
  dueDate: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded', 'pending', 'late'], default: 'submitted' },
  grade: { type: String },
  feedback: { type: String },
  gradedBy: { type: String },
  gradedAt: { type: Date }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], required: true },
  walletAddress: { type: String, sparse: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return candidatePassword === this.password;
};

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Database seeding
async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('🌱 Seeding database...');
      
      const initialUsers = [
        {
          username: 'admin',
          email: 'admin@educhain.com',
          password: 'password123',
          name: 'System Administrator',
          role: 'admin'
        },
        {
          username: 'lecturer',
          email: 'lecturer@educhain.com',  
          password: 'password123',
          name: 'Dr. Jane Smith',
          role: 'lecturer'
        },
        {
          username: 'student',
          email: 'student@educhain.com',
          password: 'password123', 
          name: 'John Student',
          role: 'student'
        }
      ];

      await User.insertMany(initialUsers);
      console.log('✅ Initial users created');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/educhain')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    seedDatabase();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, walletAddress } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.trim() });
    
    if (!user || password !== user.password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (walletAddress && walletAddress !== user.walletAddress) {
      user.walletAddress = walletAddress;
      await user.save();
    }

    await AuditLog.create({
      user: user.name,
      action: 'Login',
      details: `User logged in from ${req.ip}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Submit Assignment
app.post('/api/assignments/submit', upload.single('assignmentFile'), async (req, res) => {
  try {
    const { title, courseCode, description, studentId, studentName, dueDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const due = new Date(dueDate);
    const now = new Date();
    const status = now > due ? 'late' : 'submitted';
    
    const assignment = new Assignment({
      title,
      courseCode,
      description,
      studentId,
      studentName,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      dueDate: due,
      status
    });
    
    const savedAssignment = await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      assignment: {
        id: savedAssignment._id,
        title: savedAssignment.title,
        status: savedAssignment.status,
        submittedAt: savedAssignment.submittedAt
      }
    });
    
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
});

// Get student's submissions
app.get('/api/assignments/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const submissions = await Assignment.find({ studentId })
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Get specific submission details
app.get('/api/assignments/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Assignment.findById(submissionId).select('-filePath');
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submission details' });
  }
});

// Download assignment file
app.get('/api/assignments/download/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Assignment.findById(submissionId);
    
    if (!submission || !fs.existsSync(submission.filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${submission.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(path.resolve(submission.filePath));
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download file' });
  }
});

// Get all assignments
app.get('/api/assignments/all', async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// Grade assignment
app.put('/api/assignments/grade/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, gradedBy } = req.body;
    
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      submissionId,
      {
        grade,
        feedback,
        gradedBy,
        gradedAt: new Date(),
        status: 'graded'
      },
      { new: true }
    ).select('-filePath');
    
    if (!updatedAssignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    
    res.json({
      success: true,
      message: 'Assignment graded successfully',
      assignment: updatedAssignment
    });
    
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ success: false, error: 'Failed to grade assignment' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name;
    user.email = email;
    user.role = role;
    await user.save();

    await AuditLog.create({
      user: 'Admin',
      action: 'User Updated',
      details: `User updated: ${user.username}`,
      ipAddress: req.ip
    });

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get audit logs
app.get('/api/audit', async (req, res) => {
  try {
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000);
    res.json({ success: true, auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Debug endpoints (remove in production)
app.get('/api/debug', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const mongoStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    const userCount = await User.countDocuments();
    const assignmentCount = await Assignment.countDocuments();
    const auditCount = await AuditLog.countDocuments();
    const testUsers = await User.find().select('username role');

    res.json({
      mongodb: { status: mongoStates[mongoStatus] || 'unknown' },
      collections: { users: userCount, assignments: assignmentCount, auditLogs: auditCount },
      testUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message, mongodb: 'connection failed' });
  }
});

app.post('/api/manual-seed', async (req, res) => {
  try {
    await User.deleteMany({});
    await Assignment.deleteMany({});
    await AuditLog.deleteMany({});
    
    const initialUsers = [
      { username: 'admin', email: 'admin@educhain.com', password: 'password123', name: 'System Administrator', role: 'admin' },
      { username: 'lecturer', email: 'lecturer@educhain.com', password: 'password123', name: 'Dr. Jane Smith', role: 'lecturer' },
      { username: 'student', email: 'student@educhain.com', password: 'password123', name: 'John Student', role: 'student' }
    ];

    const createdUsers = await User.insertMany(initialUsers);
    
    await AuditLog.create({
      user: 'System',
      action: 'Manual Database Seed',
      details: 'Database manually seeded with initial users',
      ipAddress: req.ip || 'localhost'
    });

    res.json({ 
      success: true, 
      message: 'Database seeded successfully',
      users: createdUsers.map(u => ({ username: u.username, role: u.role }))
    });
  } catch (error) {
    console.error('Manual seed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// For Vercel, export the app
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}