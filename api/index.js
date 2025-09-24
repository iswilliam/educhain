

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { Web3 } = require('web3');
require('dotenv').config();
// ABI new code
const CONTRACT_ABI = [
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
];
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

// Initialize Web3 and Contract (More robust initialization)
let web3, contract;
let blockchainEnabled = false;

async function initializeBlockchain() {
  console.log('=== Starting blockchain initialization ===');
  
  try {
    // Check each environment variable individually
    console.log('Checking environment variables...');
    console.log('SEPOLIA_RPC_URL exists:', !!process.env.SEPOLIA_RPC_URL);
    console.log('CONTRACT_ADDRESS exists:', !!process.env.CONTRACT_ADDRESS);
    console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
    
    if (!process.env.SEPOLIA_RPC_URL) {
      throw new Error('SEPOLIA_RPC_URL not set');
    }
    if (!process.env.CONTRACT_ADDRESS) {
      throw new Error('CONTRACT_ADDRESS not set');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set');
    }
    
    console.log('Environment variables check passed');
    console.log('RPC URL:', process.env.SEPOLIA_RPC_URL);
    console.log('Contract Address:', process.env.CONTRACT_ADDRESS);
    
    // Test Web3 initialization
    console.log('Initializing Web3...');
    web3 = new Web3(process.env.SEPOLIA_RPC_URL);
    console.log('Web3 initialized successfully');
    
    // Test network connection
    console.log('Testing network connection...');
    const networkId = await web3.eth.net.getId();
    console.log('Network ID:', networkId.toString());
    
    const blockNumber = await web3.eth.getBlockNumber();
    console.log('Latest block number:', blockNumber.toString());
    
    // Test private key
    console.log('Testing private key...');
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    console.log('Account address:', account.address);
    
    // Check account balance
    const balance = await web3.eth.getBalance(account.address);
    console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    
    // Initialize contract
    console.log('Initializing contract...');
    contract = new web3.eth.Contract(CONTRACT_ABI, process.env.CONTRACT_ADDRESS);
    console.log('Contract initialized successfully');
    
    // Test contract connection (optional - might fail if contract not deployed)
    try {
      console.log('Testing contract connection...');
      const contractCode = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
      if (contractCode === '0x') {
        console.log('WARNING: No contract code found at address - contract may not be deployed');
      } else {
        console.log('Contract code found - contract is deployed');
      }
    } catch (contractTestError) {
      console.log('Contract test failed (this may be normal):', contractTestError.message);
    }
    
    blockchainEnabled = true;
    console.log('=== Blockchain initialization completed successfully ===');
    
  } catch (error) {
    console.error('=== Blockchain initialization failed ===');
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    blockchainEnabled = false;
    web3 = null;
    contract = null;
  }
}

initializeBlockchain();

// ADD THIS FUNCTION HERE:
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Blockchain Helper Functions


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
  
  // Always create local record first - this ensures operations don't fail
  const blockchainRecord = new BlockchainRecord({
    recordType,
    recordId,
    dataHash,
    previousHash,
    blockNumber,
    merkleRoot: recordHash,
    nonce: 'local_' + Date.now(),
    verified: false
  });
  
  await blockchainRecord.save();
  console.log('Local blockchain record saved:', recordHash);
  
  // Try blockchain transaction in background - don't let it block the operation
  if (blockchainEnabled && web3 && contract) {
    setImmediate(async () => {
      try {
        console.log('Attempting blockchain transaction...');
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
        
        console.log('Sending transaction with gas:', gas, 'gasPrice:', gasPrice);
        
        const receipt = await tx.send({
          from: account.address,
          gas: Math.floor(gas * 1.2),
          gasPrice: gasPrice
        });
        
        console.log('Blockchain transaction successful:', receipt.transactionHash);
        
        // Update record with transaction hash
        blockchainRecord.nonce = receipt.transactionHash;
        blockchainRecord.verified = true;
        await blockchainRecord.save();
        
      } catch (error) {
        console.error('Background blockchain transaction failed:', error.message);
        // Don't throw - just log the error
      }
    });
  } else {
    console.log('Blockchain not available - saving locally only');
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
    
    console.log('Creating assignment template:', title);
    
    const assignmentTemplate = new AssignmentTemplate({
      title,
      description,
      courseCode,
      instructions,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 100,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      createdByName
    });
    
    await assignmentTemplate.save();
    console.log('Assignment saved to database');
    
    // Try blockchain record creation with error handling
    let blockchainHash = 'local_' + Date.now();
    let blockchainTx = null;
    
    try {
      const blockchainRecord = await createBlockchainRecord('assignment_template', assignmentTemplate._id, {
        title,
        description,
        courseCode,
        createdBy: createdByName,
        createdAt: assignmentTemplate.createdAt
      });
      
      blockchainHash = blockchainRecord.dataHash || blockchainRecord.merkleRoot;
      blockchainTx = blockchainRecord._id.toString();
      console.log('Blockchain record created');
    } catch (blockchainError) {
      console.error('Blockchain record creation failed:', blockchainError);
      // Continue without blockchain
    }
    
    assignmentTemplate.blockchainHash = blockchainHash;
    assignmentTemplate.blockchainTx = blockchainTx;
    await assignmentTemplate.save();
    
    try {
      await logActivity(createdBy, createdByName, 'Assignment Template Created', `Created assignment: ${title}`, 'assignment_template', assignmentTemplate._id, req.ip, {
        courseCode,
        dueDate,
        blockchainHash
      });
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    
    res.json({
      success: true,
      message: 'Assignment template created successfully',
      assignment: assignmentTemplate,
      blockchainHash
    });
    
  } catch (error) {
    console.error('Assignment template creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create assignment template: ' + error.message });
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

// Add this route after your other routes
app.get('/api/blockchain/status', (req, res) => {
  res.json({
    blockchainEnabled,
    web3Connected: !!web3,
    contractLoaded: !!contract,
    rpcUrl: process.env.SEPOLIA_RPC_URL ? 'Set' : 'Not set',
    contractAddress: process.env.CONTRACT_ADDRESS ? 'Set' : 'Not set',
    privateKey: process.env.PRIVATE_KEY ? 'Set' : 'Not set'
  });
});

app.get('/api/blockchain/test', async (req, res) => {
  try {
    if (!blockchainEnabled) {
      return res.json({ success: false, error: 'Blockchain not initialized' });
    }
    
    const blockNumber = await web3.eth.getBlockNumber();
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    const balance = await web3.eth.getBalance(account.address);
    
    res.json({
      success: true,
      blockNumber: blockNumber.toString(), // Convert BigInt to string
      accountAddress: account.address,
      balance: web3.utils.fromWei(balance, 'ether') + ' ETH',
      contractAddress: process.env.CONTRACT_ADDRESS
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/blockchain/rpc-test', async (req, res) => {
  try {
    const { Web3 } = require('web3');
    
    console.log('Testing RPC URL:', process.env.SEPOLIA_RPC_URL);
    
    const web3 = new Web3(process.env.SEPOLIA_RPC_URL);
    
    const blockNumber = await web3.eth.getBlockNumber();
    
    res.json({
      success: true,
      rpcUrl: process.env.SEPOLIA_RPC_URL,
      blockNumber: blockNumber.toString(), // Convert BigInt to string
      message: 'RPC connection successful'
    });
    
  } catch (error) {
    console.error('RPC test failed:', error);
    res.json({
      success: false,
      error: error.message,
      rpcUrl: process.env.SEPOLIA_RPC_URL
    });
  }
});

app.get('/api/debug/blockchain-init', async (req, res) => {
  try {
    // Force re-initialization for testing
    console.log('=== FORCED RE-INITIALIZATION ===');
    await initializeBlockchain();
    
    res.json({
      success: true,
      blockchainEnabled,
      web3Connected: !!web3,
      contractLoaded: !!contract,
      rpcUrl: process.env.SEPOLIA_RPC_URL,
      contractAddress: process.env.CONTRACT_ADDRESS,
      privateKeyExists: !!process.env.PRIVATE_KEY,
      message: 'Check server logs for detailed initialization output'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      blockchainEnabled,
      web3Connected: !!web3,
      contractLoaded: !!contract
    });
  }
});

app.get('/api/debug/contract-check', async (req, res) => {
  try {
    if (!process.env.SEPOLIA_RPC_URL || !process.env.CONTRACT_ADDRESS) {
      return res.json({ success: false, error: 'Missing environment variables' });
    }
    
    const testWeb3 = new Web3(process.env.SEPOLIA_RPC_URL);
    
    // Check if contract is deployed
    const contractCode = await testWeb3.eth.getCode(process.env.CONTRACT_ADDRESS);
    const isDeployed = contractCode !== '0x';
    
    // Get network info
    const networkId = await testWeb3.eth.net.getId();
    const blockNumber = await testWeb3.eth.getBlockNumber();
    
    res.json({
      success: true,
      contractAddress: process.env.CONTRACT_ADDRESS,
      contractDeployed: isDeployed,
      contractCodeLength: contractCode.length,
      networkId: networkId.toString(),
      latestBlock: blockNumber.toString(),
      rpcUrl: process.env.SEPOLIA_RPC_URL
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      contractAddress: process.env.CONTRACT_ADDRESS,
      rpcUrl: process.env.SEPOLIA_RPC_URL
    });
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
    
    const template = await AssignmentTemplate.findById(assignmentTemplateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Assignment template not found' });
    }
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    const now = new Date();
    const status = now > template.dueDate ? 'late' : 'submitted';
    
    const submission = new Submission({
      assignmentTemplate: new mongoose.Types.ObjectId(assignmentTemplateId),
      studentId: new mongoose.Types.ObjectId(studentId),
      studentName,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileHash,
      status
    });
    
    submission.verificationHash = generateHash({
      assignmentTemplateId,
      studentId,
      fileName: req.file.originalname,
      fileHash,
      submittedAt: submission.submittedAt
    });
    
    await submission.save();
    
    // Try blockchain record with error handling
    let blockchainHash = 'local_' + Date.now();
    let blockchainTx = null;
    
    try {
      const blockchainRecord = await createBlockchainRecord('submission', submission._id, {
        assignmentTemplateId,
        studentId,
        studentName,
        fileHash,
        submittedAt: submission.submittedAt,
        verificationHash: submission.verificationHash
      });
      
      blockchainHash = blockchainRecord.dataHash || blockchainRecord.merkleRoot;
      blockchainTx = blockchainRecord._id.toString();
    } catch (blockchainError) {
      console.error('Blockchain record creation failed:', blockchainError);
    }
    
    submission.blockchainHash = blockchainHash;
    submission.blockchainTx = blockchainTx;
    await submission.save();
    
    try {
      await logActivity(studentId, studentName, 'Assignment Submitted', `Submitted assignment: ${template.title}`, 'submission', submission._id, req.ip, {
        assignmentTitle: template.title,
        courseCode: template.courseCode,
        fileHash,
        status,
        blockchainHash
      });
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    
    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: {
        id: submission._id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        blockchainHash,
        verificationHash: submission.verificationHash
      }
    });
    
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit assignment: ' + error.message });
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
    
    if (!submissionId || !marks || !gradedBy) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const submission = await Submission.findById(submissionId)
      .populate('assignmentTemplate', 'title courseCode maxMarks');
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const grader = await User.findById(gradedBy);
    if (!grader) {
      return res.status(404).json({ success: false, error: 'Grader not found' });
    }
    
    submission.grade = marks.toString();
    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = new mongoose.Types.ObjectId(gradedBy);
    submission.gradedByName = grader.name;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    
    await submission.save();
    
    // Try blockchain record with error handling
    let blockchainHash = 'local_' + Date.now();
    
    try {
      const blockchainRecord = await createBlockchainRecord('grade', submission._id, {
        submissionId: submission._id,
        studentName: submission.studentName,
        grade: marks,
        marks,
        gradedBy: grader.name,
        gradedAt: submission.gradedAt,
        assignmentTitle: submission.assignmentTemplate.title
      });
      
      blockchainHash = blockchainRecord.dataHash || blockchainRecord.merkleRoot;
    } catch (blockchainError) {
      console.error('Blockchain record creation failed:', blockchainError);
    }
    
    try {
      await logActivity(gradedBy, grader.name, 'Assignment Graded', `Graded assignment: ${submission.assignmentTemplate.title} - Grade: ${marks}`, 'grade', submission._id, req.ip, {
        studentName: submission.studentName,
        assignmentTitle: submission.assignmentTemplate.title,
        grade: marks,
        marks,
        blockchainHash
      });
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    
    res.json({
      success: true,
      message: 'Assignment graded successfully',
      submission,
      blockchainHash
    });
    
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ success: false, error: 'Failed to grade submission: ' + error.message });
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
