// ABI new code
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "addAuthorizedUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dataHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "previousHash",
				"type": "string"
			}
		],
		"name": "createRecord",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "RecordCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorizedUsers",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "recordHashes",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "records",
		"outputs": [
			{
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dataHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "previousHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "blockNumber",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			}
		],
		"name": "verifyRecord",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "recordType",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "dataHash",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "previousHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "blockNumber",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					}
				],
				"internalType": "struct EduChain.Record",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const Web3 = require('web3');
require('dotenv').config();
// ABI new code
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "addAuthorizedUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dataHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "previousHash",
				"type": "string"
			}
		],
		"name": "createRecord",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "RecordCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorizedUsers",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "recordHashes",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "records",
		"outputs": [
			{
				"internalType": "string",
				"name": "recordType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dataHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "previousHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "blockNumber",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			}
		],
		"name": "verifyRecord",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "recordType",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "dataHash",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "previousHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "blockNumber",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					}
				],
				"internalType": "struct EduChain.Record",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://educhain7.vercel.app'] 
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
  resourceType: { type: String, enum: ['assignment_template', 'submission', 'user', 'grade', 'blockchain', 'auth'] },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  blockchainHash: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

const AssignmentTemplate = mongoose.model('AssignmentTemplate', assignmentTemplateSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const BlockchainRecord = mongoose.model('BlockchainRecord', blockchainRecordSchema);
const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Initialize Web3 and Contract (Non-blocking)
let web3, contract;
let blockchainEnabled = false;

async function initializeBlockchain() {
  try {
    web3 = new Web3(process.env.SEPOLIA_RPC_URL);
    contract = new web3.eth.Contract(CONTRACT_ABI, process.env.CONTRACT_ADDRESS);
    
    // Test connection
    await web3.eth.getBlockNumber();
    blockchainEnabled = true;
    console.log('✅ Blockchain connection established');
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error.message);
    blockchainEnabled = false;
  }
}

// Initialize blockchain connection but don't block server startup
initializeBlockchain();


// Blockchain Helper Functions
// function generateHash(data) {
//   return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
// }

async function createBlockchainRecord(recordType, recordId, data) {
  const dataHash = generateHash(data);
  const lastRecord = await BlockchainRecord.findOne().sort({ blockNumber: -1 });
  const blockNumber = lastRecord ? lastRecord.blockNumber + 1 : 1;
  const previousHash = lastRecord ? lastRecord.dataHash : '0';
  
  const recordHash = generateHash({
    recordType,
    recordId: recordId.toString(),
    dataHash,
    previousHash,
    timestamp: Date.now()
  });
  
  // Always save to local database first
  const blockchainRecord = new BlockchainRecord({
    recordType,
    recordId,
    dataHash,
    previousHash,
    blockNumber,
    merkleRoot: recordHash,
    nonce: 'pending_' + Date.now(),
    verified: false
  });
  
  await blockchainRecord.save();
  
  // Try blockchain transaction if available
  if (blockchainEnabled && web3 && contract) {
    try {
      const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
      web3.eth.accounts.wallet.add(account);
      
      const tx = contract.methods.createRecord(
        recordHash,
        recordType,
        dataHash,
        previousHash
      );
      
      const gas = await tx.estimateGas({ from: account.address });
      const gasPrice = await web3.eth.getGasPrice();
      
      const receipt = await tx.send({
        from: account.address,
        gas: Math.floor(gas * 1.2),
        gasPrice: gasPrice
      });
      
      // Update record with transaction hash
      blockchainRecord.nonce = receipt.transactionHash;
      blockchainRecord.verified = true;
      await blockchainRecord.save();
      
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      // Keep local record with verified = false
    }
  }
  
  return blockchainRecord;
}




async function logActivity(userId, userName, action, details, resourceType, resourceId, ipAddress, metadata = {}, userAgent = '', sessionId = '') {
  try {
    const auditEntry = new AuditLog({
      user: userName,
      userId,
      action,
      details,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      sessionId,
      metadata
    });
    
    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
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

    // Fix: Query the 'users' table properly
    const user = await User.findOne({ username: username.trim() });
    
    if (!user || password !== user.password) {
      await logActivity(null, username, 'Failed Login Attempt', `Invalid credentials for ${username}`, 'auth', null, req.ip, { 
        attemptedUsername: username,
        failureReason: 'invalid_credentials'
      }, req.get('User-Agent'));
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (walletAddress && walletAddress !== user.walletAddress) {
      user.walletAddress = walletAddress;
      await user.save();
    }

    await logActivity(user._id, user.name, 'Login', `User logged in successfully`, 'auth', user._id, req.ip, { 
      walletAddress,
      loginMethod: 'username_password',
      userRole: user.role
    }, req.get('User-Agent'));

    // Fix: Return user._id instead of user.id for MongoDB
    res.json({
      success: true,
      user: {
        id: user._id.toString(), // Convert ObjectId to string for frontend
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

// Change password route
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    
    if (!user || currentPassword !== user.password) {
      await logActivity(userId, 'Unknown User', 'Password Change Failed', 'Invalid current password', 'user', userId, req.ip, {}, req.get('User-Agent'));
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity(user._id, user.name, 'Password Changed', 'User successfully changed password', 'user', user._id, req.ip, { 
      securityAction: true 
    }, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
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
      createdBy: new mongoose.Types.ObjectId(createdBy), // This line is correct
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
      assignment: assignmentTemplate, // This returns the created assignment
      blockchainHash: blockchainRecord.dataHash
    });
    
  } catch (error) {
    console.error('Assignment template creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create assignment template' });
  }
});

// Add after your existing routes
app.post('/api/blockchain/verify', async (req, res) => {
  try {
    const { hash, recordId, type } = req.body;
    
    // First, verify the record exists in database
    let dbRecord;
    if (type === 'assignment_template') {
      dbRecord = await AssignmentTemplate.findById(recordId);
    } else if (type === 'submission') {
      dbRecord = await Submission.findById(recordId);
    }
    
    if (!dbRecord) {
      return res.json({ success: false, error: 'Record not found in database' });
    }
    
    const recordHash = dbRecord.blockchainHash || hash;
    
    // Find corresponding blockchain record in local storage
    const localRecord = await BlockchainRecord.findOne({ 
      $or: [
        { recordId: recordId },
        { dataHash: recordHash },
        { merkleRoot: recordHash }
      ]
    });
    
    if (!localRecord) {
      return res.json({ success: false, error: 'Local blockchain record not found' });
    }
    
    // Check if blockchain is available
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({
        success: true,
        verified: false,
        contractVerified: false,
        localVerified: true,
        blockchainRecord: {
          dataHash: localRecord.dataHash,
          blockNumber: localRecord.blockNumber,
          timestamp: localRecord.timestamp,
          recordType: localRecord.recordType,
          transactionHash: localRecord.nonce
        },
        message: 'Blockchain network unavailable - local verification only'
      });
    }
    
    // Verify on Sepolia network
    let contractVerified = false;
    let contractRecord = null;
    
    try {
      const result = await contract.methods.verifyRecord(recordHash).call();
      contractVerified = result[0];
      if (contractVerified) {
        contractRecord = result[1];
      }
    } catch (contractError) {
      console.log('Contract verification failed:', contractError.message);
    }
    
    // Verify chain integrity in local storage
    let chainValid = true;
    if (localRecord.blockNumber > 1) {
      const previousRecord = await BlockchainRecord.findOne({
        blockNumber: localRecord.blockNumber - 1
      });
      
      if (!previousRecord || localRecord.previousHash !== previousRecord.dataHash) {
        chainValid = false;
      }
    }
    
    res.json({
      success: true,
      verified: contractVerified && chainValid,
      contractVerified,
      localVerified: true,
      chainIntegrity: chainValid,
      blockchainRecord: {
        dataHash: localRecord.dataHash,
        blockNumber: localRecord.blockNumber,
        timestamp: localRecord.timestamp,
        recordType: localRecord.recordType,
        transactionHash: localRecord.nonce
      },
      contractRecord: contractRecord ? {
        dataHash: contractRecord.dataHash,
        recordType: contractRecord.recordType,
        blockNumber: contractRecord.blockNumber.toString(),
        timestamp: new Date(contractRecord.timestamp * 1000).toISOString(),
        creator: contractRecord.creator
      } : null
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed: ' + error.message });
  }
});

// Get assignment templates (for students to view available assignments)
app.get('/api/assignments/templates', async (req, res) => {
  try {
    console.log('Fetching assignment templates...'); // Debug log
    
    const templates = await AssignmentTemplate.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${templates.length} assignment templates`); // Debug log
    
    // Convert to frontend-friendly format
    const templatesList = templates.map(template => ({
      _id: template._id.toString(),
      title: template.title,
      description: template.description,
      courseCode: template.courseCode,
      instructions: template.instructions,
      dueDate: template.dueDate,
      maxMarks: template.maxMarks,
      createdBy: template.createdBy._id.toString(), // Convert ObjectId to string
      createdByName: template.createdByName,
      createdAt: template.createdAt,
      isActive: template.isActive,
      blockchainHash: template.blockchainHash,
      blockchainTx: template.blockchainTx
    }));
    
    res.json({ success: true, templates: templatesList });
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
      assignmentTemplate: new mongoose.Types.ObjectId(assignmentTemplateId), // Ensure ObjectId
      studentId: new mongoose.Types.ObjectId(studentId), // Ensure ObjectId
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
    console.log(`Fetching submissions for student: ${studentId}`); // Debug log
    
    const submissions = await Submission.find({ 
      $or: [
        { studentId: studentId },
        { studentId: new mongoose.Types.ObjectId(studentId) }
      ]
    })
      .populate('assignmentTemplate', 'title courseCode dueDate maxMarks')
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    console.log(`Found ${submissions.length} submissions for student`); // Debug log
    
    // Convert to frontend-friendly format
    const submissionsList = submissions.map(sub => ({
      _id: sub._id.toString(),
      assignmentTemplate: {
        _id: sub.assignmentTemplate._id.toString(),
        title: sub.assignmentTemplate.title,
        courseCode: sub.assignmentTemplate.courseCode,
        dueDate: sub.assignmentTemplate.dueDate,
        maxMarks: sub.assignmentTemplate.maxMarks
      },
      studentId: sub.studentId.toString(),
      studentName: sub.studentName,
      fileName: sub.fileName,
      originalName: sub.originalName,
      fileSize: sub.fileSize,
      fileHash: sub.fileHash,
      submittedAt: sub.submittedAt,
      status: sub.status,
      grade: sub.grade,
      marks: sub.marks,
      feedback: sub.feedback,
      gradedBy: sub.gradedBy?.toString(),
      gradedByName: sub.gradedByName,
      gradedAt: sub.gradedAt,
      blockchainHash: sub.blockchainHash,
      blockchainTx: sub.blockchainTx,
      verificationHash: sub.verificationHash
    }));
    
    res.json({ success: true, submissions: submissionsList });
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Get all submissions (for lecturers)
app.get('/api/submissions/all', async (req, res) => {
  try {
    console.log('Fetching all submissions...'); // Debug log
    
    const submissions = await Submission.find({})
      .populate('assignmentTemplate', 'title courseCode dueDate maxMarks createdBy createdByName')
      .populate('studentId', 'name email username')
      .sort({ submittedAt: -1 })
      .select('-filePath');
    
    console.log(`Found ${submissions.length} total submissions`); // Debug log
    
    // Convert to frontend-friendly format
    const submissionsList = submissions.map(sub => ({
      _id: sub._id.toString(),
      assignmentTemplate: {
        _id: sub.assignmentTemplate._id.toString(),
        title: sub.assignmentTemplate.title,
        courseCode: sub.assignmentTemplate.courseCode,
        dueDate: sub.assignmentTemplate.dueDate,
        maxMarks: sub.assignmentTemplate.maxMarks,
        createdBy: sub.assignmentTemplate.createdBy?.toString(),
        createdByName: sub.assignmentTemplate.createdByName
      },
      studentId: sub.studentId._id.toString(),
      studentName: sub.studentName,
      student: {
        _id: sub.studentId._id.toString(),
        name: sub.studentId.name,
        email: sub.studentId.email,
        username: sub.studentId.username
      },
      fileName: sub.fileName,
      originalName: sub.originalName,
      fileSize: sub.fileSize,
      fileHash: sub.fileHash,
      submittedAt: sub.submittedAt,
      status: sub.status,
      grade: sub.grade,
      marks: sub.marks,
      feedback: sub.feedback,
      gradedBy: sub.gradedBy?.toString(),
      gradedByName: sub.gradedByName,
      gradedAt: sub.gradedAt,
      blockchainHash: sub.blockchainHash,
      blockchainTx: sub.blockchainTx,
      verificationHash: sub.verificationHash
    }));
    
    res.json({ success: true, submissions: submissionsList });
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Grade submission (lecturers only)
app.put('/api/submissions/grade', async (req, res) => {
  try {
    const { submissionId, marks, feedback, gradedBy } = req.body;
    
    const submission = await Submission.findById(submissionId)
      .populate('assignmentTemplate', 'title courseCode maxMarks');
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const grader = await User.findById(gradedBy);
    
    submission.grade = marks.toString();
    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = new mongoose.Types.ObjectId(gradedBy);
    submission.gradedByName = grader ? grader.name : 'Unknown';
    submission.gradedAt = new Date();
    submission.status = 'graded';
    
    await submission.save();
    
    // Create blockchain record for grading
    const blockchainRecord = await createBlockchainRecord('grade', submission._id, {
      submissionId: submission._id,
      studentName: submission.studentName,
      grade: marks,
      marks,
      gradedBy: grader.name,
      gradedAt: submission.gradedAt,
      assignmentTitle: submission.assignmentTemplate.title
    });
    
    await logActivity(gradedBy, grader.name, 'Assignment Graded', `Graded assignment: ${submission.assignmentTemplate.title} - Grade: ${marks}`, 'grade', submission._id, req.ip, {
      studentName: submission.studentName,
      assignmentTitle: submission.assignmentTemplate.title,
      grade: marks,
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
    // Fix: Query the 'users' table and return proper structure
    const users = await User.find().select('-password');
    
    // Convert MongoDB documents to plain objects with id field
    const usersList = users.map(user => ({
      id: user._id.toString(),
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
    
    res.json({ success: true, users: usersList });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
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






// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// const multer = require('multer');
// const fs = require('fs');
// const crypto = require('crypto');
// require('dotenv').config();

// const app = express();

// const Web3 = require('web3');

// // Environment variable validation
// if (!process.env.MONGODB_URI) {
//   console.error('❌ MONGODB_URI environment variable is required');
//   process.exit(1);
// }

// if (!process.env.CONTRACT_ADDRESS) {
//   console.warn('⚠️  CONTRACT_ADDRESS not set - blockchain features will be limited');
// }

// if (!process.env.PRIVATE_KEY) {
//   console.warn('⚠️  PRIVATE_KEY not set - blockchain transactions will fail');
// }

// console.log('🔧 Environment check complete');
// console.log('📊 Database URI configured:', process.env.MONGODB_URI ? 'Yes' : 'No');
// console.log('🔗 Contract Address:', process.env.CONTRACT_ADDRESS ? 'Set' : 'Not Set');
// console.log('🔐 Private Key:', process.env.PRIVATE_KEY ? 'Set' : 'Not Set');

// // Initialize Web3
// const web3 = new Web3(process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/4bde9e9fe8b940be8983f49eb61d4432');
// // Contract ABI - replace with your deployed contract ABI
// const contractABI =
//   [
// 	{
// 		"anonymous": false,
// 		"inputs": [
// 			{
// 				"indexed": true,
// 				"internalType": "string",
// 				"name": "hash",
// 				"type": "string"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "string",
// 				"name": "description",
// 				"type": "string"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "address",
// 				"name": "creator",
// 				"type": "address"
// 			}
// 		],
// 		"name": "RecordStored",
// 		"type": "event"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "string",
// 				"name": "hash",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "description",
// 				"type": "string"
// 			}
// 		],
// 		"name": "storeRecord",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "allHashes",
// 		"outputs": [
// 			{
// 				"internalType": "string",
// 				"name": "",
// 				"type": "string"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "string",
// 				"name": "hash",
// 				"type": "string"
// 			}
// 		],
// 		"name": "getRecord",
// 		"outputs": [
// 			{
// 				"components": [
// 					{
// 						"internalType": "string",
// 						"name": "dataHash",
// 						"type": "string"
// 					},
// 					{
// 						"internalType": "string",
// 						"name": "description",
// 						"type": "string"
// 					},
// 					{
// 						"internalType": "uint256",
// 						"name": "timestamp",
// 						"type": "uint256"
// 					},
// 					{
// 						"internalType": "address",
// 						"name": "creator",
// 						"type": "address"
// 					}
// 				],
// 				"internalType": "struct EduChainRecords.Record",
// 				"name": "",
// 				"type": "tuple"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "string",
// 				"name": "",
// 				"type": "string"
// 			}
// 		],
// 		"name": "records",
// 		"outputs": [
// 			{
// 				"internalType": "string",
// 				"name": "dataHash",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "description",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "uint256",
// 				"name": "timestamp",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "creator",
// 				"type": "address"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	}
// ]

// // Contract instance
// const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);

// // Account setup
// let account = null;
// if (process.env.PRIVATE_KEY) {
//   account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
//   web3.eth.accounts.wallet.add(account);
// }

// // Middleware
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? ['https://educhain7.vercel.app'] 
//     : ['http://localhost:3000', 'http://127.0.0.1:3000'],
//   credentials: true
// }));
// app.use(express.json());

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join('/tmp', 'uploads', 'assignments');
//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: function (req, file, cb) {
//     const allowedTypes = /pdf|doc|docx|txt|zip/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb('Error: Only PDF, DOC, DOCX, TXT, and ZIP files are allowed!');
//     }
//   }
// });

// // Enhanced Schemas

// // Assignment Template Schema (Created by Lecturers)
// const assignmentTemplateSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   courseCode: { type: String, required: true },
//   instructions: { type: String },
//   dueDate: { type: Date, required: true },
//   maxMarks: { type: Number, default: 100 },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdByName: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
//   isActive: { type: Boolean, default: true },
//   blockchainHash: { type: String },
//   blockchainTx: { type: String }
// });

// // Student Submission Schema
// const submissionSchema = new mongoose.Schema({
//   assignmentTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'AssignmentTemplate', required: true },
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   studentName: { type: String, required: true },
//   fileName: { type: String },
//   filePath: { type: String },
//   originalName: { type: String },
//   fileSize: { type: Number },
//   fileHash: { type: String }, // SHA-256 hash of file content
//   submittedAt: { type: Date, default: Date.now },
//   status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
//   grade: { type: String },
//   marks: { type: Number },
//   feedback: { type: String },
//   gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   gradedByName: { type: String },
//   gradedAt: { type: Date },
//   blockchainHash: { type: String },
//   blockchainTx: { type: String },
//   verificationHash: { type: String } // Combined hash for blockchain verification
// });

// // Blockchain Record Schema
// const blockchainRecordSchema = new mongoose.Schema({
//   recordType: { type: String, enum: ['assignment_template', 'submission', 'grade'], required: true },
//   recordId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   dataHash: { type: String, required: true },
//   previousHash: { type: String },
//   blockNumber: { type: Number, required: true },
//   timestamp: { type: Date, default: Date.now },
//   merkleRoot: { type: String },
//   nonce: { type: String },
//   verified: { type: Boolean, default: true },
//   ethereumTxHash: { type: String },
//   ethereumVerified: { type: Boolean, default: false }, 
//   description: { type: String } 
// });

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   name: { type: String, required: true },
//   role: { type: String, enum: ['student', 'lecturer', 'admin'], required: true },
//   walletAddress: { type: String, sparse: true },
//   isActive: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now }
// });

// userSchema.methods.comparePassword = function(candidatePassword) {
//   return candidatePassword === this.password;
// };

// // Enhanced Audit Log Schema
// const auditLogSchema = new mongoose.Schema({
//   user: { type: String, required: true },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   action: { type: String, required: true },
//   details: { type: String, required: true },
//   resourceType: { type: String, enum: ['assignment_template', 'submission', 'user', 'grade', 'blockchain', 'auth'] },
//   resourceId: { type: mongoose.Schema.Types.ObjectId },
//   timestamp: { type: Date, default: Date.now },
//   ipAddress: { type: String },
//   userAgent: { type: String },
//   sessionId: { type: String },
//   blockchainHash: { type: String },
//   metadata: { type: mongoose.Schema.Types.Mixed }
// });

// const AssignmentTemplate = mongoose.model('AssignmentTemplate', assignmentTemplateSchema);
// const Submission = mongoose.model('Submission', submissionSchema);
// const BlockchainRecord = mongoose.model('BlockchainRecord', blockchainRecordSchema);
// const User = mongoose.model('User', userSchema);
// const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// // Blockchain Helper Functions
// function generateHash(data) {
//   return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
// }

// function generateMerkleRoot(hashes) {
//   if (hashes.length === 0) return '';
//   if (hashes.length === 1) return hashes[0];
  
//   const newHashes = [];
//   for (let i = 0; i < hashes.length; i += 2) {
//     const left = hashes[i];
//     const right = i + 1 < hashes.length ? hashes[i + 1] : left;
//     newHashes.push(crypto.createHash('sha256').update(left + right).digest('hex'));
//   }
  
//   return generateMerkleRoot(newHashes);
// }

// async function createBlockchainRecord(recordType, recordId, data) {
//   const dataHash = generateHash(data);
//   const lastRecord = await BlockchainRecord.findOne().sort({ blockNumber: -1 });
//   const blockNumber = lastRecord ? lastRecord.blockNumber + 1 : 1;
//   const previousHash = lastRecord ? lastRecord.dataHash : '0';
  
//   // Create description
//   let description = '';
//   switch (recordType) {
//     case 'assignment_template':
//       description = `Assignment: ${data.title} (${data.courseCode}) created by ${data.createdBy}`;
//       break;
//     case 'submission':
//       description = `Submission by ${data.studentName} for assignment`;
//       break;
//     case 'grade':
//       description = `Grade ${data.marks} assigned by ${data.gradedBy} for ${data.assignmentTitle}`;
//       break;
//     default:
//       description = `${recordType} record created`;
//   }
  
//   let ethereumTxHash = null;
//   let ethereumVerified = false;
  
//   // Store on Ethereum Sepolia
//   try {
//     if (account && process.env.CONTRACT_ADDRESS) {
//       console.log('Storing on Ethereum...');
      
//       const gasEstimate = await contract.methods.storeRecord(dataHash, description).estimateGas({
//         from: account.address
//       });
      
//       const gasPrice = await web3.eth.getGasPrice();
      
//       const result = await contract.methods.storeRecord(dataHash, description).send({
//         from: account.address,
//         gas: Math.floor(gasEstimate * 1.2),
//         gasPrice: gasPrice
//       });
      
//       ethereumTxHash = result.transactionHash;
//       ethereumVerified = true;
      
//       console.log(`Stored on Ethereum: ${ethereumTxHash}`);
//     } else {
//       throw new Error('No private key or contract address configured');
//     }
//   } catch (ethError) {
//     console.error('Ethereum storage failed:', ethError.message);
//     // Don't fail the entire operation, just log the error
//   }
  
//   const blockchainRecord = new BlockchainRecord({
//     recordType,
//     recordId,
//     dataHash,
//     previousHash,
//     blockNumber,
//     nonce: crypto.randomBytes(16).toString('hex'),
//     merkleRoot: generateMerkleRoot([dataHash, previousHash]),
//     ethereumTxHash,
//     ethereumVerified,
//     description
//   });
  
//   await blockchainRecord.save();
//   return blockchainRecord;
// }

// async function logActivity(userId, userName, action, details, resourceType, resourceId, ipAddress, metadata = {}, userAgent = '', sessionId = '') {
//   try {
//     const auditEntry = new AuditLog({
//       user: userName,
//       userId,
//       action,
//       details,
//       resourceType,
//       resourceId,
//       ipAddress,
//       userAgent,
//       sessionId,
//       metadata
//     });
    
//     await auditEntry.save();
//     return auditEntry;
//   } catch (error) {
//     console.error('Audit logging failed:', error);
//   }
// }

// // Database seeding
// async function seedDatabase() {
//   try {
//     const userCount = await User.countDocuments();
    
//     if (userCount === 0) {
//       console.log('🌱 Seeding database...');
      
//       const initialUsers = [
//         {
//           username: 'admin',
//           email: 'admin@educhain.com',
//           password: 'password123',
//           name: 'System Administrator',
//           role: 'admin'
//         },
//         {
//           username: 'lecturer',
//           email: 'lecturer@educhain.com',  
//           password: 'password123',
//           name: 'Dr. Jane Smith',
//           role: 'lecturer'
//         },
//         {
//           username: 'student',
//           email: 'student@educhain.com',
//           password: 'password123', 
//           name: 'John Student',
//           role: 'student'
//         }
//       ];

//       const createdUsers = await User.insertMany(initialUsers);
      
//       // Create sample assignment template
//       const lecturer = createdUsers.find(u => u.role === 'lecturer');
//       const sampleAssignment = new AssignmentTemplate({
//         title: 'Web Development Fundamentals',
//         description: 'Create a responsive website using HTML, CSS, and JavaScript',
//         courseCode: 'CS101',
//         instructions: 'Submit a zip file containing your HTML, CSS, and JS files. Include a README with setup instructions.',
//         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
//         maxMarks: 100,
//         createdBy: lecturer._id,
//         createdByName: lecturer.name
//       });
      
//       await sampleAssignment.save();
      
//       // Create blockchain record for assignment
//       await createBlockchainRecord('assignment_template', sampleAssignment._id, {
//         title: sampleAssignment.title,
//         courseCode: sampleAssignment.courseCode,
//         createdBy: sampleAssignment.createdByName,
//         createdAt: sampleAssignment.createdAt
//       });
      
//       console.log('✅ Initial users and sample assignment created');
//     }
//   } catch (error) {
//     console.error('❌ Seeding error:', error);
//   }
// }

// // Connect to MongoDB
// // Connect to MongoDB - No fallback, must connect to production DB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(async () => {
//     console.log('✅ Connected to MongoDB successfully');
//     console.log('📊 Database:', mongoose.connection.db.databaseName);
    
//     // Check if we can perform basic operations
//     try {
//       const collections = await mongoose.connection.db.listCollections().toArray();
//       console.log('📁 Available collections:', collections.map(c => c.name).join(', '));
      
//       // Seed database only if needed
//       await seedDatabase();
//     } catch (dbError) {
//       console.error('❌ Database operation failed:', dbError);
//       process.exit(1);
//     }
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection failed:', err.message);
//     console.error('🔍 Check your MONGODB_URI environment variable');
//     console.error('🔗 Current URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')); // Hide password in logs
//     process.exit(1);
//   });

// // Handle MongoDB connection events
// mongoose.connection.on('error', (err) => {
//   console.error('❌ MongoDB connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//   console.warn('⚠️  MongoDB disconnected');
// });

// mongoose.connection.on('reconnected', () => {
//   console.log('🔄 MongoDB reconnected');
// });

// // Routes

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // Login route
// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { username, password, walletAddress } = req.body;
    
//     if (!username || !password) {
//       return res.status(400).json({ success: false, error: 'Username and password required' });
//     }

//     // Fix: Query the 'users' table properly
//     const user = await User.findOne({ username: username.trim() });
    
//     if (!user || password !== user.password) {
//       await logActivity(null, username, 'Failed Login Attempt', `Invalid credentials for ${username}`, 'auth', null, req.ip, { 
//         attemptedUsername: username,
//         failureReason: 'invalid_credentials'
//       }, req.get('User-Agent'));
//       return res.status(401).json({ success: false, error: 'Invalid credentials' });
//     }

//     if (walletAddress && walletAddress !== user.walletAddress) {
//       user.walletAddress = walletAddress;
//       await user.save();
//     }

//     await logActivity(user._id, user.name, 'Login', `User logged in successfully`, 'auth', user._id, req.ip, { 
//       walletAddress,
//       loginMethod: 'username_password',
//       userRole: user.role
//     }, req.get('User-Agent'));

//     // Fix: Return user._id instead of user.id for MongoDB
//     res.json({
//       success: true,
//       user: {
//         id: user._id.toString(), // Convert ObjectId to string for frontend
//         username: user.username,
//         name: user.name,
//         role: user.role,
//         walletAddress: user.walletAddress
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ success: false, error: 'Internal server error' });
//   }
// });

// // Change password route
// app.put('/api/auth/change-password', async (req, res) => {
//   try {
//     const { userId, currentPassword, newPassword } = req.body;
    
//     if (!userId || !currentPassword || !newPassword) {
//       return res.status(400).json({ success: false, error: 'All fields required' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
//     }

//     const user = await User.findById(userId);
    
//     if (!user || currentPassword !== user.password) {
//       await logActivity(userId, 'Unknown User', 'Password Change Failed', 'Invalid current password', 'user', userId, req.ip, {}, req.get('User-Agent'));
//       return res.status(401).json({ success: false, error: 'Current password is incorrect' });
//     }

//     user.password = newPassword;
//     await user.save();

//     await logActivity(user._id, user.name, 'Password Changed', 'User successfully changed password', 'user', user._id, req.ip, { 
//       securityAction: true 
//     }, req.get('User-Agent'));

//     res.json({
//       success: true,
//       message: 'Password changed successfully'
//     });

//   } catch (error) {
//     console.error('Password change error:', error);
//     res.status(500).json({ success: false, error: 'Internal server error' });
//   }
// });

// // Assignment Template Routes (Lecturer Only)
// app.post('/api/assignments/template', async (req, res) => {
//   try {
//     const { title, description, courseCode, instructions, dueDate, maxMarks, createdBy, createdByName } = req.body;
    
//     const assignmentTemplate = new AssignmentTemplate({
//       title,
//       description,
//       courseCode,
//       instructions,
//       dueDate: new Date(dueDate),
//       maxMarks: maxMarks || 100,
//       createdBy: new mongoose.Types.ObjectId(createdBy), // This line is correct
//       createdByName
//     });
    
//     await assignmentTemplate.save();
    
//     // Create blockchain record
//     const blockchainRecord = await createBlockchainRecord('assignment_template', assignmentTemplate._id, {
//       title,
//       description,
//       courseCode,
//       createdBy: createdByName,
//       createdAt: assignmentTemplate.createdAt
//     });
    
//     assignmentTemplate.blockchainHash = blockchainRecord.dataHash;
//     assignmentTemplate.blockchainTx = blockchainRecord._id.toString();
//     await assignmentTemplate.save();
    
//     await logActivity(createdBy, createdByName, 'Assignment Template Created', `Created assignment: ${title}`, 'assignment_template', assignmentTemplate._id, req.ip, {
//       courseCode,
//       dueDate,
//       blockchainHash: blockchainRecord.dataHash
//     });
    
//     res.json({
//       success: true,
//       message: 'Assignment template created successfully',
//       assignment: assignmentTemplate, // This returns the created assignment
//       blockchainHash: blockchainRecord.dataHash
//     });
    
//   } catch (error) {
//     console.error('Assignment template creation error:', error);
//     res.status(500).json({ success: false, error: 'Failed to create assignment template' });
//   }
// });

// app.post('/api/blockchain/verify', async (req, res) => {
//   try {
//     const { hash, recordId, type } = req.body;
    
//     // Find blockchain record
//     const blockchainRecord = await BlockchainRecord.findOne({ 
//       $or: [
//         { recordId: recordId },
//         { dataHash: hash },
//         { ethereumTxHash: hash }
//       ]
//     });
    
//     if (!blockchainRecord) {
//       return res.json({ success: false, error: 'Blockchain record not found' });
//     }
    
//     // Verify chain integrity
//     let chainValid = true;
//     if (blockchainRecord.blockNumber > 1) {
//       const previousRecord = await BlockchainRecord.findOne({
//         blockNumber: blockchainRecord.blockNumber - 1
//       });
      
//       if (!previousRecord || blockchainRecord.previousHash !== previousRecord.dataHash) {
//         chainValid = false;
//       }
//     }
    
//     // Real Ethereum verification
//     let ethereumVerified = false;
//     let ethereumDetails = null;
    
//     if (blockchainRecord.ethereumTxHash) {
//       try {
//         const [transaction, receipt] = await Promise.all([
//           web3.eth.getTransaction(blockchainRecord.ethereumTxHash),
//           web3.eth.getTransactionReceipt(blockchainRecord.ethereumTxHash)
//         ]);
        
//         if (transaction && receipt) {
//           ethereumVerified = receipt.status === true || receipt.status === '0x1';
          
//           // Get contract data to verify the hash was actually stored
//           let contractVerified = false;
//           try {
//             const contractRecord = await contract.methods.getRecord(blockchainRecord.dataHash).call();
//             contractVerified = contractRecord && contractRecord[0] === blockchainRecord.dataHash;
//           } catch (contractError) {
//             console.log('Contract verification failed:', contractError.message);
//           }
          
//           ethereumDetails = {
//             transactionHash: blockchainRecord.ethereumTxHash,
//             blockNumber: transaction.blockNumber,
//             gasUsed: receipt.gasUsed.toString(),
//             status: ethereumVerified ? 'Success' : 'Failed',
//             explorerUrl: `https://sepolia.etherscan.io/tx/${blockchainRecord.ethereumTxHash}`,
//             contractVerified,
//             from: transaction.from,
//             to: transaction.to
//           };
//         }
//       } catch (ethError) {
//         console.error('Ethereum verification failed:', ethError.message);
//       }
//     }
    
//     res.json({
//       success: true,
//       verified: chainValid && ethereumVerified,
//       ethereumVerified,
//       ethereumDetails,
//       blockchainRecord: {
//         dataHash: blockchainRecord.dataHash,
//         blockNumber: blockchainRecord.blockNumber,
//         timestamp: blockchainRecord.timestamp,
//         recordType: blockchainRecord.recordType,
//         description: blockchainRecord.description,
//         verified: blockchainRecord.verified && chainValid,
//         ethereumTxHash: blockchainRecord.ethereumTxHash
//       },
//       chainIntegrity: chainValid
//     });
    
//   } catch (error) {
//     console.error('Verification error:', error);
//     res.status(500).json({ success: false, error: 'Verification failed: ' + error.message });
//   }
// });

// // Get assignment templates (for students to view available assignments)
// app.get('/api/assignments/templates', async (req, res) => {
//   try {
//     console.log('Fetching assignment templates...'); // Debug log
    
//     const templates = await AssignmentTemplate.find({ isActive: true })
//       .populate('createdBy', 'name email')
//       .sort({ createdAt: -1 });
    
//     console.log(`Found ${templates.length} assignment templates`); // Debug log
    
//     // Convert to frontend-friendly format
//     const templatesList = templates.map(template => ({
//       _id: template._id.toString(),
//       title: template.title,
//       description: template.description,
//       courseCode: template.courseCode,
//       instructions: template.instructions,
//       dueDate: template.dueDate,
//       maxMarks: template.maxMarks,
//       createdBy: template.createdBy._id.toString(), // Convert ObjectId to string
//       createdByName: template.createdByName,
//       createdAt: template.createdAt,
//       isActive: template.isActive,
//       blockchainHash: template.blockchainHash,
//       blockchainTx: template.blockchainTx
//     }));
    
//     res.json({ success: true, templates: templatesList });
//   } catch (error) {
//     console.error('Error fetching assignment templates:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch assignment templates' });
//   }
// });

// // Submit assignment (students)
// app.post('/api/assignments/submit', upload.single('assignmentFile'), async (req, res) => {
//   try {
//     const { assignmentTemplateId, studentId, studentName } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ success: false, error: 'No file uploaded' });
//     }
    
//     // Check if assignment template exists
//     const template = await AssignmentTemplate.findById(assignmentTemplateId);
//     if (!template) {
//       return res.status(404).json({ success: false, error: 'Assignment template not found' });
//     }
    
//     // Generate file hash
//     const fileBuffer = fs.readFileSync(req.file.path);
//     const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
//     // Check submission status
//     const now = new Date();
//     const status = now > template.dueDate ? 'late' : 'submitted';
    
//     const submission = new Submission({
//       assignmentTemplate: new mongoose.Types.ObjectId(assignmentTemplateId), // Ensure ObjectId
//       studentId: new mongoose.Types.ObjectId(studentId), // Ensure ObjectId
//       studentName,
//       fileName: req.file.filename,
//       filePath: req.file.path,
//       originalName: req.file.originalname,
//       fileSize: req.file.size,
//       fileHash,
//       status
//     });
    
//     // Generate verification hash
//     submission.verificationHash = generateHash({
//       assignmentTemplateId,
//       studentId,
//       fileName: req.file.originalname,
//       fileHash,
//       submittedAt: submission.submittedAt
//     });
    
//     await submission.save();
    
//     // Create blockchain record
//     const blockchainRecord = await createBlockchainRecord('submission', submission._id, {
//       assignmentTemplateId,
//       studentId,
//       studentName,
//       fileHash,
//       submittedAt: submission.submittedAt,
//       verificationHash: submission.verificationHash
//     });
    
//     submission.blockchainHash = blockchainRecord.dataHash;
//     submission.blockchainTx = blockchainRecord._id.toString();
//     await submission.save();
    
//     await logActivity(studentId, studentName, 'Assignment Submitted', `Submitted assignment: ${template.title}`, 'submission', submission._id, req.ip, {
//       assignmentTitle: template.title,
//       courseCode: template.courseCode,
//       fileHash,
//       status,
//       blockchainHash: blockchainRecord.dataHash
//     });
    
//     res.json({
//       success: true,
//       message: 'Assignment submitted successfully',
//       submission: {
//         id: submission._id,
//         status: submission.status,
//         submittedAt: submission.submittedAt,
//         blockchainHash: blockchainRecord.dataHash,
//         verificationHash: submission.verificationHash
//       }
//     });
    
//   } catch (error) {
//     console.error('Assignment submission error:', error);
//     res.status(500).json({ success: false, error: 'Failed to submit assignment' });
//   }
// });

// // Get student's submissions
// app.get('/api/submissions/student/:studentId', async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     console.log(`Fetching submissions for student: ${studentId}`); // Debug log
    
//     const submissions = await Submission.find({ 
//       $or: [
//         { studentId: studentId },
//         { studentId: new mongoose.Types.ObjectId(studentId) }
//       ]
//     })
//       .populate('assignmentTemplate', 'title courseCode dueDate maxMarks')
//       .sort({ submittedAt: -1 })
//       .select('-filePath');
    
//     console.log(`Found ${submissions.length} submissions for student`); // Debug log
    
//     // Convert to frontend-friendly format
//     const submissionsList = submissions.map(sub => ({
//       _id: sub._id.toString(),
//       assignmentTemplate: {
//         _id: sub.assignmentTemplate._id.toString(),
//         title: sub.assignmentTemplate.title,
//         courseCode: sub.assignmentTemplate.courseCode,
//         dueDate: sub.assignmentTemplate.dueDate,
//         maxMarks: sub.assignmentTemplate.maxMarks
//       },
//       studentId: sub.studentId.toString(),
//       studentName: sub.studentName,
//       fileName: sub.fileName,
//       originalName: sub.originalName,
//       fileSize: sub.fileSize,
//       fileHash: sub.fileHash,
//       submittedAt: sub.submittedAt,
//       status: sub.status,
//       grade: sub.grade,
//       marks: sub.marks,
//       feedback: sub.feedback,
//       gradedBy: sub.gradedBy?.toString(),
//       gradedByName: sub.gradedByName,
//       gradedAt: sub.gradedAt,
//       blockchainHash: sub.blockchainHash,
//       blockchainTx: sub.blockchainTx,
//       verificationHash: sub.verificationHash
//     }));
    
//     res.json({ success: true, submissions: submissionsList });
//   } catch (error) {
//     console.error('Error fetching student submissions:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
//   }
// });

// // Get all submissions (for lecturers)
// app.get('/api/submissions/all', async (req, res) => {
//   try {
//     console.log('Fetching all submissions...'); // Debug log
    
//     const submissions = await Submission.find({})
//       .populate('assignmentTemplate', 'title courseCode dueDate maxMarks createdBy createdByName')
//       .populate('studentId', 'name email username')
//       .sort({ submittedAt: -1 })
//       .select('-filePath');
    
//     console.log(`Found ${submissions.length} total submissions`); // Debug log
    
//     // Convert to frontend-friendly format
//     const submissionsList = submissions.map(sub => ({
//       _id: sub._id.toString(),
//       assignmentTemplate: {
//         _id: sub.assignmentTemplate._id.toString(),
//         title: sub.assignmentTemplate.title,
//         courseCode: sub.assignmentTemplate.courseCode,
//         dueDate: sub.assignmentTemplate.dueDate,
//         maxMarks: sub.assignmentTemplate.maxMarks,
//         createdBy: sub.assignmentTemplate.createdBy?.toString(),
//         createdByName: sub.assignmentTemplate.createdByName
//       },
//       studentId: sub.studentId._id.toString(),
//       studentName: sub.studentName,
//       student: {
//         _id: sub.studentId._id.toString(),
//         name: sub.studentId.name,
//         email: sub.studentId.email,
//         username: sub.studentId.username
//       },
//       fileName: sub.fileName,
//       originalName: sub.originalName,
//       fileSize: sub.fileSize,
//       fileHash: sub.fileHash,
//       submittedAt: sub.submittedAt,
//       status: sub.status,
//       grade: sub.grade,
//       marks: sub.marks,
//       feedback: sub.feedback,
//       gradedBy: sub.gradedBy?.toString(),
//       gradedByName: sub.gradedByName,
//       gradedAt: sub.gradedAt,
//       blockchainHash: sub.blockchainHash,
//       blockchainTx: sub.blockchainTx,
//       verificationHash: sub.verificationHash
//     }));
    
//     res.json({ success: true, submissions: submissionsList });
//   } catch (error) {
//     console.error('Error fetching all submissions:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
//   }
// });

// // Grade submission (lecturers only)
// app.put('/api/submissions/grade', async (req, res) => {
//   try {
//     const { submissionId, marks, feedback, gradedBy } = req.body;
    
//     const submission = await Submission.findById(submissionId)
//       .populate('assignmentTemplate', 'title courseCode maxMarks');
    
//     if (!submission) {
//       return res.status(404).json({ success: false, error: 'Submission not found' });
//     }

//     const grader = await User.findById(gradedBy);
    
//     submission.grade = marks.toString();
//     submission.marks = marks;
//     submission.feedback = feedback;
//     submission.gradedBy = new mongoose.Types.ObjectId(gradedBy);
//     submission.gradedByName = grader ? grader.name : 'Unknown';
//     submission.gradedAt = new Date();
//     submission.status = 'graded';
    
//     await submission.save();
    
//     // Create blockchain record for grading
//     const blockchainRecord = await createBlockchainRecord('grade', submission._id, {
//       submissionId: submission._id,
//       studentName: submission.studentName,
//       grade: marks,
//       marks,
//       gradedBy: grader.name,
//       gradedAt: submission.gradedAt,
//       assignmentTitle: submission.assignmentTemplate.title
//     });
    
//     await logActivity(gradedBy, grader.name, 'Assignment Graded', `Graded assignment: ${submission.assignmentTemplate.title} - Grade: ${marks}`, 'grade', submission._id, req.ip, {
//       studentName: submission.studentName,
//       assignmentTitle: submission.assignmentTemplate.title,
//       grade: marks,
//       marks,
//       blockchainHash: blockchainRecord.dataHash
//     });
    
//     res.json({
//       success: true,
//       message: 'Assignment graded successfully',
//       submission,
//       blockchainHash: blockchainRecord.dataHash
//     });
    
//   } catch (error) {
//     console.error('Grading error:', error);
//     res.status(500).json({ success: false, error: 'Failed to grade submission' });
//   }
// });



// // Get blockchain records for transparency
// app.get('/api/blockchain/records', async (req, res) => {
//   try {
//     const records = await BlockchainRecord.find({})
//       .sort({ blockNumber: -1 })
//       .limit(100);
    
//     res.json({ success: true, records });
//   } catch (error) {
//     console.error('Error fetching blockchain records:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch blockchain records' });
//   }
// });

// // Get users (admin only)
// app.get('/api/users', async (req, res) => {
//   try {
//     // Fix: Query the 'users' table and return proper structure
//     const users = await User.find().select('-password');
    
//     // Convert MongoDB documents to plain objects with id field
//     const usersList = users.map(user => ({
//       id: user._id.toString(),
//       _id: user._id,
//       username: user.username,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       walletAddress: user.walletAddress,
//       isActive: user.isActive,
//       createdAt: user.createdAt
//     }));
    
//     res.json({ success: true, users: usersList });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch users' });
//   }
// });

// // Get audit logs
// app.get('/api/audit', async (req, res) => {
//   try {
//     const auditLogs = await AuditLog.find()
//       .populate('userId', 'name role')
//       .sort({ timestamp: -1 })
//       .limit(1000);
//     res.json({ success: true, auditLogs });
//   } catch (error) {
//     res.status(500).json({ success: false, error: 'Internal server error' });
//   }
// });

// // Download submission file
// app.get('/api/submissions/download/:submissionId', async (req, res) => {
//   try {
//     const { submissionId } = req.params;
//     const submission = await Submission.findById(submissionId);
    
//     if (!submission || !fs.existsSync(submission.filePath)) {
//       return res.status(404).json({ success: false, error: 'File not found' });
//     }
    
//     res.setHeader('Content-Disposition', `attachment; filename="${submission.originalName}"`);
//     res.setHeader('Content-Type', 'application/octet-stream');
//     res.sendFile(path.resolve(submission.filePath));
    
//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).json({ success: false, error: 'Failed to download file' });
//   }
// });

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('Unhandled error:', error);
//   res.status(500).json({ success: false, error: 'Internal server error' });
// });

// const PORT = process.env.PORT || 3000;

// // For Vercel, export the app
// if (process.env.VERCEL) {
//   module.exports = app;
// } else {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// }


