

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
    
  // Test network connection with timeout
console.log('Testing network connection...');
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Connection timeout after 40 seconds')), 40000)
);

const networkId = await Promise.race([
  web3.eth.net.getId(),
  timeoutPromise
]);
console.log('Network ID:', networkId.toString());

const blockNumber = await Promise.race([
  web3.eth.getBlockNumber(),
  timeoutPromise
]);
console.log('Latest block number:', blockNumber.toString());
    
    // Test private key
console.log('Testing private key...');
// ADD THESE LINES:
let privateKey = process.env.PRIVATE_KEY;
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}
const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());
console.log('Account address:', account.address);
    
// Check account balance
try {
  const balance = await Promise.race([
    web3.eth.getBalance(account.address),
    timeoutPromise
  ]);
  console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
} catch (balanceError) {
  console.log('Balance check failed:', balanceError.message);
}
    
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


// ADD THIS FUNCTION HERE:
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// ADD THIS HELPER FUNCTION:
function getFormattedPrivateKey() {
  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
  return privateKey;
}
// Blockchain Helper Functions


// Enhanced version with better error handling and BigInt safety:

// Replace your createBlockchainRecord function with this version that has timeout handling:

// Replace your createBlockchainRecord function with this version that has timeout handling:

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
  
  // Always create local record first
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
  
  // Background blockchain transaction with timeout
  if (blockchainEnabled && web3 && contract) {
    setImmediate(async () => {
      const startTime = Date.now();
      
      try {
        console.log('=== Starting blockchain transaction ===');
        
        // Validate private key
        let privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
          throw new Error('Private key not available');
        }
        
        privateKey = privateKey.trim();
const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());        
        console.log('Using account:', account.address);
        
        // Check account balance first
        try {
          const balance = await Promise.race([
            web3.eth.getBalance(account.address),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Balance check timeout')), 120000))
          ]);
          const balanceEth = web3.utils.fromWei(balance, 'ether');
          console.log('Account balance:', balanceEth, 'ETH');
          
          if (parseFloat(balanceEth) < 0.001) {
            throw new Error(`Insufficient balance: ${balanceEth} ETH. Need at least 0.001 ETH for gas.`);
          }
        } catch (balanceError) {
          console.error('Balance check failed:', balanceError.message);
          throw balanceError;
        }
        
        // Clear wallet and add account
        web3.eth.accounts.wallet.clear();
        web3.eth.accounts.wallet.add(account);
        
        // Prepare contract method
        const tx = contract.methods.createRecord(
          recordHash,
          recordType,
          dataHash,
          previousHash
        );
        
        // Get gas estimate with timeout
        console.log('Estimating gas...');
        let gas;
        try {
          const gasEstimate = await Promise.race([
            tx.estimateGas({ from: account.address }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Gas estimation timeout')), 120000))
          ]);
          
          gas = typeof gasEstimate === 'bigint' ? Number(gasEstimate) : parseInt(gasEstimate);
          gas = Math.floor(gas * 1.3); // Add 30% buffer
          console.log('Gas estimate:', gas);
          
        } catch (gasError) {
          console.log('Gas estimation failed:', gasError.message);
          gas = 600000; // Higher default gas limit
          console.log('Using default gas:', gas);
        }
        
        // Get gas price with timeout and minimum enforcement
        console.log('Getting gas price...');
        let gasPriceStr;
        try {
          const gasPriceBigInt = await Promise.race([
            web3.eth.getGasPrice(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Gas price timeout')), 120000))
          ]);
          
          let gasPrice = typeof gasPriceBigInt === 'bigint' ? Number(gasPriceBigInt) : Number(gasPriceBigInt);
          console.log('Network gas price:', gasPrice, 'wei');
          
          // Enforce minimum gas price for Sepolia (5 gwei minimum)
          const minGasPrice = 5000000000; // 5 gwei in wei
          if (gasPrice < minGasPrice) {
            console.log(`Gas price too low (${gasPrice}), using minimum: ${minGasPrice}`);
            gasPrice = minGasPrice;
          }
          
          // Add 20% buffer to ensure faster mining
          gasPrice = Math.floor(gasPrice * 1.2);
          gasPriceStr = gasPrice.toString();
          
          console.log('Final gas price:', gasPriceStr, 'wei');
          console.log('Gas price in gwei:', (gasPrice / 1000000000).toFixed(2), 'gwei');
          
        } catch (priceError) {
          console.log('Gas price fetch failed:', priceError.message);
          gasPriceStr = '10000000000'; // 10 gwei default - higher for reliability
          console.log('Using default gas price:', gasPriceStr, 'wei (10 gwei)');
        }
        
        // Calculate total cost
        const totalCostWei = BigInt(gas) * BigInt(gasPriceStr);
        const totalCostEth = web3.utils.fromWei(totalCostWei, 'ether');
        console.log('Estimated transaction cost:', totalCostEth, 'ETH');
        
        // Send transaction with timeout and detailed monitoring
        console.log('Sending transaction...');
        console.log('Transaction parameters:');
        console.log('- From:', account.address);
        console.log('- Gas:', gas);
        console.log('- Gas Price:', gasPriceStr, 'wei');
        console.log('- Gas Price (gwei):', (parseInt(gasPriceStr) / 1000000000).toFixed(2));
        console.log('- Contract:', process.env.CONTRACT_ADDRESS);
        console.log('- Estimated cost:', totalCostEth, 'ETH');
        
        // Create transaction with event monitoring
        const txObject = {
          from: account.address,
          gas: gas,
          gasPrice: gasPriceStr
        };
        
        console.log('Creating transaction...');
        const txPromise = tx.send(txObject)
          .on('transactionHash', (hash) => {
            console.log('✅ Transaction hash received:', hash);
            console.log('⏳ Waiting for confirmation...');
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            if (confirmationNumber === 0) {
              console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
            }
          })
          .on('error', (error) => {
            console.error('❌ Transaction error event:', error.message);
          });
        
        // Add timeout to transaction (90 seconds for Sepolia)
        const timeoutPromise = new Promise((_, reject) => {
          const timeoutId = setTimeout(() => {
            console.error('⏰ Transaction timeout after 90 seconds');
            reject(new Error('Transaction timeout after 90 seconds - network may be congested'));
          }, 120000);
          
          // Clear timeout if transaction completes
          txPromise.then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
        });
        
        console.log('⏳ Waiting for transaction to complete (timeout: 90s)...');
        const receipt = await Promise.race([txPromise, timeoutPromise]);
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 120000;
        
        console.log('=== Transaction successful! ===');
        console.log('Transaction hash:', receipt.transactionHash);
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed?.toString());
        console.log('Duration:', duration, 'seconds');
        
        // Update local record
        blockchainRecord.nonce = receipt.transactionHash;
        blockchainRecord.verified = true;
        await blockchainRecord.save();
        
        console.log('Local record updated successfully');
        
      } catch (error) {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 120000;
        
        console.error('=== Blockchain transaction failed ===');
        console.error('Duration before failure:', duration, 'seconds');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        // Specific error handling
        if (error.message.includes('timeout')) {
          console.error('TIMEOUT: Transaction took too long - network may be congested');
        } else if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          console.error('FUNDS: Account needs more ETH for gas fees');
        } else if (error.message.includes('gas')) {
          console.error('GAS: Gas estimation or execution failed');
        } else if (error.message.includes('nonce')) {
          console.error('NONCE: Transaction nonce issue - may need to wait for previous transactions');
        } else if (error.message.includes('revert')) {
          console.error('CONTRACT: Contract execution reverted - check contract state');
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          console.error('NETWORK: Connection to Sepolia network failed');
        }
        
        // Log full error for debugging
        console.error('Full error object:', error);
        
        // Update record with error status
        try {
          blockchainRecord.nonce = 'failed_' + Date.now();
          blockchainRecord.verified = false;
          await blockchainRecord.save();
        } catch (saveError) {
          console.error('Failed to update record with error status:', saveError);
        }
      }
    });
  } else {
    console.log('Blockchain not available - local storage only');
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
    initializeBlockchain();
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

   try {
  await logActivity(user._id, user.name, 'Login', `User logged in successfully`, 'auth', user._id, req.ip, { 
    walletAddress,
    loginMethod: 'username_password',
    userRole: user.role
  }, req.get('User-Agent'));
} catch (logError) {
  console.error('Login audit logging failed:', logError);
}

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
    
    let localRecord;
    
    // If hash only is provided (from verification form)
    if (hash && !recordId) {
      localRecord = await BlockchainRecord.findOne({ 
        $or: [
          { dataHash: hash },
          { merkleRoot: hash },
          { nonce: hash }
        ]
      });
    } else {
      // If recordId and type provided (from specific record verification)
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
      localRecord = await BlockchainRecord.findOne({ 
        $or: [
          { recordId: recordId },
          { dataHash: recordHash },
          { merkleRoot: recordHash }
        ]
      });
    }
    
    if (!localRecord) {
      return res.json({ success: false, error: 'Record not found in local blockchain storage' });
    }
    
    // Check blockchain network availability
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({
        success: true,
        verified: false,
        contractVerified: false,
        localVerified: true,
        message: 'Blockchain network unavailable - local verification only',
        record: {
          type: localRecord.recordType,
          hash: localRecord.dataHash || localRecord.merkleRoot,
          timestamp: localRecord.timestamp,
          blockNumber: localRecord.blockNumber
        }
      });
    }
    
    // Verify on Sepolia network
    let contractVerified = false;
    const verifyHash = localRecord.merkleRoot || localRecord.dataHash;
    
    try {
      const result = await contract.methods.verifyRecord(verifyHash).call();
      contractVerified = result[0];
    } catch (contractError) {
      console.log('Contract verification failed:', contractError.message);
    }
    
    res.json({
      success: true,
      verified: contractVerified,
      contractVerified,
      localVerified: true,
      record: {
        type: localRecord.recordType,
        hash: verifyHash,
        timestamp: localRecord.timestamp,
        blockNumber: localRecord.blockNumber,
        transactionHash: localRecord.nonce
      },
      message: contractVerified 
        ? 'Record verified on Sepolia blockchain' 
        : 'Record found locally but not confirmed on blockchain'
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
    const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());
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

app.post('/api/debug/init-blockchain', async (req, res) => {
  try {
    console.log('Manual blockchain initialization requested...');
    await initializeBlockchain();
    
    res.json({
      success: true,
      blockchainEnabled,
      web3Connected: !!web3,
      contractLoaded: !!contract,
      message: 'Blockchain initialization attempted - check logs'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Blockchain initialization failed'
    });
  }
});

// Add these debug routes to your Express app to help diagnose the issue:

// Test account balance and connection
app.get('/api/debug/account-status', async (req, res) => {
  try {
    if (!blockchainEnabled || !web3) {
      return res.json({ success: false, error: 'Blockchain not initialized' });
    }
    
    let privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return res.json({ success: false, error: 'Private key not available' });
    }
    
    privateKey = privateKey.trim();
const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());    
    // Test network connection
    const networkId = await web3.eth.net.getId();
    const blockNumber = await web3.eth.getBlockNumber();
    const balance = await web3.eth.getBalance(account.address);
    const gasPrice = await web3.eth.getGasPrice();
    
    res.json({
      success: true,
      account: account.address,
      networkId: networkId.toString(),
      latestBlock: blockNumber.toString(),
      balance: web3.utils.fromWei(balance, 'ether') + ' ETH',
      gasPrice: gasPrice.toString() + ' wei',
      gasPriceGwei: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei'
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// Test contract interaction
app.get('/api/debug/contract-test', async (req, res) => {
  try {
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({ success: false, error: 'Blockchain/contract not initialized' });
    }
    
    let privateKey = process.env.PRIVATE_KEY;
    privateKey = privateKey.trim();
const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());    
    // Test contract code exists
    const contractCode = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
    const isDeployed = contractCode !== '0x';
    
    if (!isDeployed) {
      return res.json({
        success: false,
        error: 'Contract not deployed',
        contractAddress: process.env.CONTRACT_ADDRESS,
        contractCodeLength: contractCode.length
      });
    }
    
    // Test gas estimation for a dummy transaction
    const testHash = 'test_' + Date.now();
    const tx = contract.methods.createRecord(testHash, 'test', 'testData', '0');
    
    let gasEstimate;
    try {
      gasEstimate = await tx.estimateGas({ from: account.address });
    } catch (gasError) {
      return res.json({
        success: false,
        error: 'Gas estimation failed',
        gasError: gasError.message,
        contractAddress: process.env.CONTRACT_ADDRESS,
        account: account.address
      });
    }
    
    res.json({
      success: true,
      contractAddress: process.env.CONTRACT_ADDRESS,
      contractDeployed: true,
      contractCodeLength: contractCode.length,
      account: account.address,
      gasEstimate: gasEstimate.toString(),
      message: 'Contract interaction test successful'
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// Test a simple contract read operation
app.get('/api/debug/contract-read-test', async (req, res) => {
  try {
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({ success: false, error: 'Blockchain/contract not initialized' });
    }
    
    // Try to read from contract (verifyRecord with a dummy hash)
    const dummyHash = 'nonexistent_hash_test';
    const result = await contract.methods.verifyRecord(dummyHash).call();
    
    res.json({
      success: true,
      message: 'Contract read test successful',
      contractAddress: process.env.CONTRACT_ADDRESS,
      testResult: {
        exists: result[0],
        recordData: result[1]
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      contractAddress: process.env.CONTRACT_ADDRESS,
      message: 'Contract read test failed'
    });
  }
});

// Force a test transaction
app.post('/api/debug/test-transaction', async (req, res) => {
  try {
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({ success: false, error: 'Blockchain/contract not initialized' });
    }
    
    let privateKey = process.env.PRIVATE_KEY;
    privateKey = privateKey.trim();
const account = web3.eth.accounts.privateKeyToAccount(getFormattedPrivateKey());    
    // Create a test transaction
    const testHash = 'debug_test_' + Date.now();
    const tx = contract.methods.createRecord(testHash, 'debug_test', 'test_data', '0');
    
    console.log('=== DEBUG: Starting test transaction ===');
    console.log('Test hash:', testHash);
    console.log('Account:', account.address);
    
    // Get gas estimate
    const gasEstimate = await tx.estimateGas({ from: account.address });
    const gas = Math.floor(Number(gasEstimate) * 1.3);
    
    // Get gas price
    const gasPriceBigInt = await web3.eth.getGasPrice();
    const gasPriceStr = gasPriceBigInt.toString();
    
    console.log('Gas:', gas);
    console.log('Gas Price:', gasPriceStr);
    
    // Send transaction with timeout
    const txPromise = tx.send({
      from: account.address,
      gas: gas,
      gasPrice: gasPriceStr
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test transaction timeout')), 120000)
    );
    
    const receipt = await Promise.race([txPromise, timeoutPromise]);
    
    console.log('=== DEBUG: Test transaction successful ===');
    console.log('TX Hash:', receipt.transactionHash);
    console.log('Block:', receipt.blockNumber);
    
    res.json({
      success: true,
      message: 'Test transaction successful',
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      testHash: testHash
    });
    
  } catch (error) {
    console.error('=== DEBUG: Test transaction failed ===');
    console.error('Error:', error.message);
    
    res.json({
      success: false,
      error: error.message,
      message: 'Test transaction failed - check server logs for details'
    });
  }
});

// Get recent blockchain records with their verification status
app.get('/api/debug/recent-records', async (req, res) => {
  try {
    const records = await BlockchainRecord.find({})
      .sort({ timestamp: -1 })
      .limit(10);
    
    const recordsWithStatus = records.map(record => ({
      _id: record._id,
      recordType: record.recordType,
      dataHash: record.dataHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      nonce: record.nonce,
      verified: record.verified,
      isLocal: record.nonce.startsWith('local_'),
      isFailed: record.nonce.startsWith('failed_'),
      hasTransactionHash: record.nonce.length === 66 && record.nonce.startsWith('0x')
    }));
    
    res.json({
      success: true,
      records: recordsWithStatus,
      summary: {
        total: recordsWithStatus.length,
        verified: recordsWithStatus.filter(r => r.verified).length,
        local: recordsWithStatus.filter(r => r.isLocal).length,
        failed: recordsWithStatus.filter(r => r.isFailed).length,
        onChain: recordsWithStatus.filter(r => r.hasTransactionHash).length
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Add this simple test route to verify transaction execution:

app.post('/api/debug/simple-tx-test', async (req, res) => {
  console.log('=== SIMPLE TRANSACTION TEST STARTED ===');
  
  try {
    if (!blockchainEnabled || !web3 || !contract) {
      return res.json({ success: false, error: 'Blockchain not ready' });
    }
    
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY.trim());
    const testHash = 'simple_test_' + Date.now();
    
    console.log('Test hash:', testHash);
    console.log('Account:', account.address);
    
    // Get current gas price and enforce minimum
    let gasPrice;
    try {
      const networkGasPrice = await web3.eth.getGasPrice();
      gasPrice = Math.max(Number(networkGasPrice), 5000000000); // Minimum 5 gwei
      gasPrice = Math.floor(gasPrice * 1.5); // 50% buffer
    } catch {
      gasPrice = 10000000000; // 10 gwei default
    }
    
    console.log('Using gas price:', gasPrice, 'wei (', (gasPrice/1000000000).toFixed(2), 'gwei)');
    
    // Create transaction
    const tx = contract.methods.createRecord(testHash, 'simple_test', 'test_data_' + Date.now(), '0');
    
    // Estimate gas
    const gasEstimate = await tx.estimateGas({ from: account.address });
    const gas = Math.floor(Number(gasEstimate) * 1.3);
    
    console.log('Gas estimate:', gas);
    
    // Send with detailed logging
    console.log('Sending transaction NOW...');
    
    const startTime = Date.now();
    let txHash = null;
    
    const receipt = await tx.send({
      from: account.address,
      gas: gas,
      gasPrice: gasPrice.toString()
    })
    .on('transactionHash', (hash) => {
      txHash = hash;
      const elapsed = Date.now() - startTime;
      console.log(`TX HASH RECEIVED (${elapsed}ms):`, hash);
    })
    .on('confirmation', (confirmationNumber, receipt) => {
      if (confirmationNumber === 0) {
        const elapsed = Date.now() - startTime;
        console.log(`CONFIRMED (${elapsed}ms): Block ${receipt.blockNumber}`);
      }
    })
    .on('error', (error) => {
      console.log('TX ERROR EVENT:', error.message);
    });
    
    const totalTime = Date.now() - startTime;
    console.log('=== TRANSACTION SUCCESSFUL ===');
    console.log('Total time:', totalTime, 'ms');
    console.log('Final TX hash:', receipt.transactionHash);
    console.log('Block number:', receipt.blockNumber);
    
    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      totalTimeMs: totalTime,
      testHash: testHash,
      gasPrice: gasPrice,
      gasPriceGwei: (gasPrice/1000000000).toFixed(2)
    });
    
  } catch (error) {
    console.error('=== SIMPLE TX TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name
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
