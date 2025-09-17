const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
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
  limits: { fileSize: 10 * 1024 * 1024 },
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

// Enhanced Schemas

// Assignment Template Schema (Created by Lecturers)
const assignmentTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  courseCode: { type: String, required: true },
  instructions: { type: String },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  blockchainHash: { type: String },
  blockchainTx: { type: String }
});

// Student Submission Schema
const submissionSchema = new mongoose.Schema({
  assignmentTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'AssignmentTemplate', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  fileName: { type: String },
  filePath: { type: String },
  originalName: { type: String },
  fileSize: { type: Number },
  fileHash: { type: String }, // SHA-256 hash of file content
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
  grade: { type: String },
  marks: { type: Number },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedByName: { type: String },
  gradedAt: { type: Date },
  blockchainHash: { type: String },
  blockchainTx: { type: String },
  verificationHash: { type: String } // Combined hash for blockchain verification
});

// Blockchain Record Schema
const blockchainRecordSchema = new mongoose.Schema({
  recordType: { type: String, enum: ['assignment_template', 'submission', 'grade'], required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, required: true },
  dataHash: { type: String, required: true },
  previousHash: { type: String },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  merkleRoot: { type: String },
  nonce: { type: String },
  verified: { type: Boolean, default: true }
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

// Enhanced Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String, required: true },
  resourceType: { type: String, enum: ['assignment_template', 'submission', 'user', 'grade', 'blockchain'] },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  blockchainHash: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

const AssignmentTemplate = mongoose.model('AssignmentTemplate', assignmentTemplateSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const BlockchainRecord = mongoose.model('BlockchainRecord', blockchainRecordSchema);
const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Blockchain Helper Functions
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function generateMerkleRoot(hashes) {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];
  
  const newHashes = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : left;
    newHashes.push(crypto.createHash('sha256').update(left + right).digest('hex'));
  }
  
  return generateMerkleRoot(newHashes);
}

async function createBlockchainRecord(recordType, recordId, data) {
  const dataHash = generateHash(data);
  const lastRecord = await BlockchainRecord.findOne().sort({ blockNumber: -1 });
  const blockNumber = lastRecord ? lastRecord.blockNumber + 1 : 1;
  const previousHash = lastRecord ? lastRecord.dataHash : '0';
  
  const blockchainRecord = new BlockchainRecord({
    recordType,
    recordId,
    dataHash,
    previousHash,
    blockNumber,
    nonce: crypto.randomBytes(16).toString('hex'),
    merkleRoot: generateMerkleRoot([dataHash, previousHash])
  });
  
  await blockchainRecord.save();
  return blockchainRecord;
}

async function logActivity(userId, userName, action, details, resourceType, resourceId, ipAddress, metadata = {}) {
  const auditEntry = new AuditLog({
    user: userName,
    userId,
    action,
    details,
    resourceType,
    resourceId,
    ipAddress,
    metadata
  });
  
  await auditEntry.save();
  return auditEntry;
}

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

      const createdUsers = await User.insertMany(initialUsers);
      
      // Create sample assignment template
      const lecturer = createdUsers.find(u => u.role === 'lecturer');
      const sampleAssignment = new AssignmentTemplate({
        title: 'Web Development Fundamentals',
        description: 'Create a responsive website using HTML, CSS, and JavaScript',
        courseCode: 'CS101',
        instructions: 'Submit a zip file containing your HTML, CSS, and JS files. Include a README with setup instructions.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxMarks: 100,
        createdBy: lecturer._id,
        createdByName: lecturer.name
      });
      
      await sampleAssignment.save();
      
      // Create blockchain record for assignment
      await createBlockchainRecord('assignment_template', sampleAssignment._id, {
        title: sampleAssignment.title,
        courseCode: sampleAssignment.courseCode,
        createdBy: sampleAssignment.createdByName,
        createdAt: sampleAssignment.createdAt
      });
      
      console.log('✅ Initial users and sample assignment created');
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

// Health check
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
      await logActivity(null, username, 'Failed Login Attempt', `Invalid credentials for ${username}`, 'user', null, req.ip);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (walletAddress && walletAddress !== user.walletAddress) {
      user.walletAddress = walletAddress;
      await user.save();
    }

    await logActivity(user._id, user.name, 'Login', `User logged in successfully`, 'user', user._id, req.ip, { walletAddress });

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

// Assignment Template Routes (Lecturer Only)
app.post('/api/assignments/template', async (req, res) => {
  try {
    const { title, description, courseCode, instructions, dueDate, maxMarks, createdBy, createdByName } = req.body;
    
    const assignmentTemplate = new AssignmentTemplate({
      title,
      description,
      courseCode,
      instructions,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 100,
      createdBy,
      createdByName
    });
    
    await assignmentTemplate.save();
    
    // Create blockchain record
    const blockchainRecord = await createBlockchainRecord('assignment_template', assignmentTemplate._id, {
      title,
      description,
      courseCode,
      createdBy: createdByName,
      createdAt: assignmentTemplate.createdAt
    });
    
    assignmentTemplate.blockchainHash = blockchainRecord.dataHash;
    assignmentTemplate.blockchainTx = blockchainRecord._id.toString();
    await assignmentTemplate.save();
    
    await logActivity(createdBy, createdByName, 'Assignment Template Created', `Created assignment: ${title}`, 'assignment_template', assignmentTemplate._id, req.ip, {
      courseCode,
      dueDate,
      blockchainHash: blockchainRecord.dataHash
    });
    
    res.json({
      success: true,
      message: 'Assignment template created successfully',
      assignment: assignmentTemplate,
      blockchainHash: blockchainRecord.dataHash
    });
    
  } catch (error) {
    console.error('Assignment template creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create assignment template' });
  }
});

// Get assignment templates (for students to view available assignments)
app.get('/api/assignments/templates', async (req, res) => {
  try {
    const templates = await AssignmentTemplate.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching assignment templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignment templates' });
  }
});

// Submit assignment (students)
app.post('/api/assignments/submit', upload.single('assignmentFile'), async (req, res) => {
  try {
    const { assignmentTemplateId, studentId, studentName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Check if assignment template exists
    const template = await AssignmentTemplate.findById(assignmentTemplateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Assignment template not found' });
    }
    
    // Generate file hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Check submission status
    const now = new Date();
    const status = now > template.dueDate ? 'late' : 'submitted';
    
    const submission = new Submission({
      assignmentTemplate: assignmentTemplateId,
      studentId,
      studentName,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileHash,
      status
    });
    
    // Generate verification hash
    submission.verificationHash = generateHash({
      assignmentTemplateId,
      studentId,
      fileName: req.file.originalname,
      fileHash,
      submittedAt: submission.submittedAt
    });
    
    await submission.save();
    
    // Create blockchain record
    const blockchainRecord = await createBlockchainRecord('submission', submission._id, {
      assignmentTemplateId,
      studentId,
      studentName,
      fileHash,
      submittedAt: submission.submittedAt,
      verificationHash: submission.verificationHash
    });
    
    submission.blockchainHash = blockchainRecord.dataHash;
    submission.blockchainTx = blockchainRecord._id.toString();
    await submission.save();
    
    await logActivity(studentId, studentName, 'Assignment Submitted', `Submitted assignment: ${template.title}`, 'submission', submission._id, req.ip, {
      assignmentTitle: template.title,
      courseCode: template.courseCode,
      fileHash,
      status,
      blockchainHash: blockchainRecord.dataHash
    });
    
    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: {
        id: submission._id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        blockchainHash: blockchainRecord.dataHash,
        verificationHash: submission.verificationHash
      }
    });
    
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
});

// Get student's submissions
app.get('/api/submissions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const submissions = await Submission.find({ studentId })
      .populate('assignmentTemplate', 'title courseCode dueDate maxMarks')
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Get all submissions (for lecturers)
app.get('/api/submissions/all', async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate('assignmentTemplate', 'title courseCode dueDate maxMarks createdByName')
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Grade submission (lecturers only)
app.put('/api/submissions/grade/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, marks, feedback, gradedBy, gradedByName } = req.body;
    
    const submission = await Submission.findById(submissionId)
      .populate('assignmentTemplate', 'title courseCode maxMarks');
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    submission.grade = grade;
    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = gradedBy;
    submission.gradedByName = gradedByName;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    
    await submission.save();
    
    // Create blockchain record for grading
    const blockchainRecord = await createBlockchainRecord('grade', submission._id, {
      submissionId: submission._id,
      studentName: submission.studentName,
      grade,
      marks,
      gradedBy: gradedByName,
      gradedAt: submission.gradedAt,
      assignmentTitle: submission.assignmentTemplate.title
    });
    
    await logActivity(gradedBy, gradedByName, 'Assignment Graded', `Graded assignment: ${submission.assignmentTemplate.title} - Grade: ${grade}`, 'grade', submission._id, req.ip, {
      studentName: submission.studentName,
      assignmentTitle: submission.assignmentTemplate.title,
      grade,
      marks,
      blockchainHash: blockchainRecord.dataHash
    });
    
    res.json({
      success: true,
      message: 'Assignment graded successfully',
      submission,
      blockchainHash: blockchainRecord.dataHash
    });
    
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ success: false, error: 'Failed to grade submission' });
  }
});

// Blockchain verification endpoint
app.post('/api/blockchain/verify', async (req, res) => {
  try {
    const { recordId, recordType } = req.body;
    
    const blockchainRecord = await BlockchainRecord.findOne({ 
      recordId, 
      recordType 
    });
    
    if (!blockchainRecord) {
      return res.json({
        success: false,
        verified: false,
        error: 'Blockchain record not found'
      });
    }
    
    // Verify chain integrity
    const previousRecord = await BlockchainRecord.findOne({
      blockNumber: blockchainRecord.blockNumber - 1
    });
    
    const chainValid = !previousRecord || blockchainRecord.previousHash === previousRecord.dataHash;
    
    res.json({
      success: true,
      verified: chainValid,
      blockchainRecord: {
        dataHash: blockchainRecord.dataHash,
        blockNumber: blockchainRecord.blockNumber,
        timestamp: blockchainRecord.timestamp,
        merkleRoot: blockchainRecord.merkleRoot,
        verified: blockchainRecord.verified
      },
      chainIntegrity: chainValid
    });
    
  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Get blockchain records for transparency
app.get('/api/blockchain/records', async (req, res) => {
  try {
    const records = await BlockchainRecord.find({})
      .sort({ blockNumber: -1 })
      .limit(100);
    
    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching blockchain records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blockchain records' });
  }
});

// Get users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get audit logs
app.get('/api/audit', async (req, res) => {
  try {
    const auditLogs = await AuditLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(1000);
    res.json({ success: true, auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Download submission file
app.get('/api/submissions/download/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId);
    
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


// Enhanced apiCall function with better error handling and debugging
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentUser ? `Bearer ${currentUser.token}` : ''
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        console.log('API Call:', endpoint, finalOptions); // Debug log
        
        const response = await fetch(endpoint, finalOptions);
        
        console.log('API Response Status:', response.status, response.statusText); // Debug log
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType); // Debug log
        
        if (!contentType || !contentType.includes('application/json')) {
            // If not JSON, get text to see what was returned
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500)); // Show first 500 chars
            throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
        }
        
        const result = await response.json();
        console.log('API Result:', result); // Debug log
        
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        
        // More specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Cannot connect to server. Check if server is running.');
        } else if (error.message.includes('Unexpected token')) {
            throw new Error('Server returned HTML instead of JSON. Check API endpoint exists.');
        } else {
            throw error;
        }
    }
}

// Updated showManageAssignments with better error handling and fallback endpoints
async function showManageAssignments() {
    const content = document.getElementById('dashboardContent');
    
    try {
        // Show loading state
        content.innerHTML = `
            <h3>My Assignments</h3>
            <div class="loading-state">
                <p>Loading your assignments...</p>
            </div>
        `;
        
        let myAssignments = [];
        let allSubmissions = [];
        
        // Try multiple endpoint patterns in order of preference
        const endpointsToTry = [
            `/api/assignments/lecturer/${currentUser.id}`,
            `/api/assignments/templates?createdBy=${currentUser.id}`,
            `/api/assignments/templates`,  // Fallback: get all and filter client-side
            `/api/assignments`  // Most basic fallback
        ];
        
        let assignmentsLoaded = false;
        
        for (const endpoint of endpointsToTry) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                
                const assignmentsResult = await apiCall(endpoint);
                
                if (assignmentsResult.success) {
                    const allAssignments = assignmentsResult.assignments || 
                                         assignmentsResult.templates || 
                                         assignmentsResult.data || [];
                    
                    // Filter for current lecturer's assignments
                    myAssignments = allAssignments.filter(a => 
                        a.createdBy === currentUser.id || 
                        a.createdBy === currentUser.id.toString() ||
                        a.lecturer === currentUser.id ||
                        a.lecturer === currentUser.id.toString()
                    );
                    
                    assignmentsLoaded = true;
                    console.log(`Successfully loaded ${myAssignments.length} assignments from ${endpoint}`);
                    break;
                } else {
                    console.log(`Endpoint ${endpoint} returned success: false`);
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed:`, error.message);
                continue; // Try next endpoint
            }
        }
        
        if (!assignmentsLoaded) {
            throw new Error('All API endpoints failed. Server may be down or endpoints not implemented.');
        }
        
        // Try to load submissions (optional - won't fail if this doesn't work)
        try {
            const submissionsEndpoints = [
                `/api/submissions/lecturer/${currentUser.id}`,
                `/api/submissions/all`,
                `/api/submissions`
            ];
            
            for (const endpoint of submissionsEndpoints) {
                try {
                    const submissionsResult = await apiCall(endpoint);
                    if (submissionsResult.success) {
                        allSubmissions = submissionsResult.submissions || 
                                       submissionsResult.data || [];
                        console.log(`Loaded ${allSubmissions.length} submissions from ${endpoint}`);
                        break;
                    }
                } catch (error) {
                    console.log(`Submissions endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
        } catch (error) {
            console.log('Could not load submissions, continuing without them');
            allSubmissions = []; // Use empty array if submissions can't be loaded
        }
        
        // Update local state with fresh data from MongoDB
        assignmentTemplates = assignmentTemplates.filter(a => a.createdBy !== currentUser.id).concat(myAssignments);
        if (allSubmissions.length > 0) {
            submissions = allSubmissions;
        }
        
        if (myAssignments.length === 0) {
            content.innerHTML = `
                <h3>My Assignments</h3>
                <div class="no-assignments">
                    <p>You haven't created any assignments yet.</p>
                    <button class="btn btn-primary" onclick="showDashboardSection('create-assignment')">Create First Assignment</button>
                    <p class="debug-info">Connected to database successfully, but no assignments found for user ID: ${currentUser.id}</p>
                </div>
            `;
            return;
        }
        
        let assignmentsHTML = `
            <h3>My Assignments</h3>
            <div class="assignments-actions">
                <button class="btn btn-primary" onclick="showDashboardSection('create-assignment')">Create New Assignment</button>
                <button class="btn btn-secondary" onclick="refreshManageAssignments()">Refresh</button>
            </div>
            <div class="assignments-grid">
        `;
        
        myAssignments.forEach(assignment => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date();
            const dueDateClass = isOverdue ? 'overdue' : '';
            
            // Count submissions for this assignment from MongoDB data
            const assignmentSubmissions = allSubmissions.filter(s => 
                (s.assignmentTemplate && s.assignmentTemplate._id === assignment._id) ||
                s.assignmentTemplateId === assignment._id ||
                s.assignmentId === assignment._id
            );
            
            const gradedCount = assignmentSubmissions.filter(s => s.grade || s.marks).length;
            const createdDate = assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'N/A';
            
            assignmentsHTML += `
                <div class="assignment-card" data-assignment-id="${assignment._id}">
                    <div class="assignment-header">
                        <h4>${assignment.title}</h4>
                        <span class="course-badge">${assignment.courseCode}</span>
                    </div>
                    <div class="assignment-details">
                        <p><strong>Description:</strong> ${assignment.description || 'No description'}</p>
                        <p><strong>Due Date:</strong> <span class="${dueDateClass}">${dueDate.toLocaleDateString()}</span></p>
                        <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                        <p><strong>Submissions:</strong> <span class="submission-count">${assignmentSubmissions.length}</span></p>
                        <p><strong>Graded:</strong> <span class="graded-count">${gradedCount}</span></p>
                        <p><strong>Pending:</strong> <span class="pending-count">${assignmentSubmissions.length - gradedCount}</span></p>
                        <p><strong>Created:</strong> ${createdDate}</p>
                        ${assignment.blockchainHash ? `<p><strong>Blockchain Hash:</strong> <code style="font-size:0.7em;word-break:break-all;background:#f0f0f0;padding:2px;border-radius:2px;cursor:pointer;" onclick="copyToClipboard('${assignment.blockchainHash}')" title="Click to copy">${assignment.blockchainHash.substring(0, 16)}...</code></p>` : ''}
                    </div>
                    <div class="assignment-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewAssignmentSubmissions('${assignment._id}')">
                            View Submissions (${assignmentSubmissions.length})
                        </button>
                        ${assignment.blockchainHash ? `<button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${assignment._id}', 'assignment_template')" title="Verify on blockchain">Verify</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        assignmentsHTML += '</div>';
        content.innerHTML = assignmentsHTML;
        
        // Show success message with data freshness
        showMessage(`Loaded ${myAssignments.length} assignments from database`, 'success');
        
    } catch (error) {
        console.error('Error loading assignments from MongoDB:', error);
        
        // Fallback to local data if available
        const localAssignments = assignmentTemplates.filter(a => a.createdBy === currentUser.id);
        
        content.innerHTML = `
            <h3>My Assignments</h3>
            <div class="error-state">
                <h4>Database Connection Error</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <div class="debug-info">
                    <details>
                        <summary>Debug Information</summary>
                        <p><strong>Current User ID:</strong> ${currentUser.id}</p>
                        <p><strong>API Base:</strong> Check if your server is running</p>
                        <p><strong>Expected Endpoints:</strong></p>
                        <ul>
                            <li>/api/assignments/lecturer/${currentUser.id}</li>
                            <li>/api/assignments/templates</li>
                            <li>/api/submissions/lecturer/${currentUser.id}</li>
                        </ul>
                        <p><strong>Common Solutions:</strong></p>
                        <ol>
                            <li>Make sure your backend server is running</li>
                            <li>Check if the API endpoints exist in your backend</li>
                            <li>Verify the server is running on the correct port</li>
                            <li>Check for CORS issues</li>
                        </ol>
                    </details>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="refreshManageAssignments()">Retry Connection</button>
                    <button class="btn btn-secondary" onclick="showDashboardSection('create-assignment')">Create New Assignment</button>
                    <button class="btn btn-outline" onclick="testApiConnection()">Test API Connection</button>
                </div>
            </div>
        `;
        
        showMessage('Failed to connect to database - check console for details', 'error');
    }
}

// Helper function to test API connection
async function testApiConnection() {
    try {
        showMessage('Testing API connection...', 'info');
        
        // Test basic connectivity
        const response = await fetch('/api/health', { method: 'GET' });
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
            const result = await response.json();
            showMessage('API connection successful!', 'success');
            console.log('API Health Check:', result);
        } else {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('API connection test failed:', error);
        showMessage('API connection failed: ' + error.message, 'error');
    }
}

// Helper function to refresh the assignments view
async function refreshManageAssignments() {
    await showManageAssignments();
}