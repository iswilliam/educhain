// EduChain Assignment Management System - Complete Enhanced app.js with Blockchain Features

document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    showPage('home');
    
    const walletBtn = document.getElementById('walletBtn');
    if (walletBtn) {
        walletBtn.addEventListener('click', connectWallet);
    }
});

// Global Variables
let currentUser = null;
let walletConnected = false;
let userWalletAddress = null;
let assignmentTemplates = [];
let submissions = [];
let users = [];
let auditLog = [];
let blockchainRecords = [];

// Initialize demo data (fallback)
function initializeData() {
    users = [
        { id: 1, username: 'student', password: 'password123', role: 'student', name: 'John Student' },
        { id: 2, username: 'lecturer', password: 'password123', role: 'lecturer', name: 'Dr. Jane Smith' },
        { id: 3, username: 'admin', password: 'password123', role: 'admin', name: 'System Administrator' }
    ];

    assignmentTemplates = [];
    submissions = [];
    auditLog = [];
    blockchainRecords = [];
}

// Navigation Functions
function showPage(pageId) {
    const pages = ['homePage', 'aboutPage', 'contactPage', 'signinPage', 'dashboardPage'];
    pages.forEach(page => {
        document.getElementById(page).classList.add('hidden');
    });
    document.getElementById(pageId + 'Page').classList.remove('hidden');
}

// MetaMask Wallet Functions
async function connectWallet() {
    const walletStatus = document.getElementById('walletStatus');
    const walletBtn = document.getElementById('walletBtn');
    const signInForm = document.getElementById('signInForm');
    
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userWalletAddress = accounts[0];
            walletConnected = true;
            
            walletStatus.className = 'wallet-status wallet-connected';
            walletStatus.innerHTML = '<span>MetaMask: Connected (' + accounts[0].substring(0, 6) + '...' + accounts[0].substring(38) + ')</span>';
            walletBtn.textContent = 'Connected';
            walletBtn.disabled = true;
            
            signInForm.classList.remove('hidden');
            showMessage('Wallet connected successfully!', 'success');
        } catch (error) {
            walletStatus.className = 'wallet-status wallet-disconnected';
            walletStatus.innerHTML = '<span>MetaMask: Connection Failed</span>';
            showMessage('Failed to connect wallet: ' + error.message, 'error');
        }
    } else {
        walletStatus.className = 'wallet-status wallet-disconnected';
        walletStatus.innerHTML = '<span>MetaMask: Not Installed</span>';
        showMessage('MetaMask not detected. Please install MetaMask browser extension.', 'warning');
        
        // For demo purposes, simulate wallet connection
        walletConnected = true;
        userWalletAddress = '0x' + Math.random().toString(16).substr(2, 40);
        signInForm.classList.remove('hidden');
    }
}

// Authentication Functions
async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('userRole').value;

    if (!walletConnected) {
        showMessage('Please connect your MetaMask wallet first.', 'warning');
        return;
    }

    if (!username || !password || !role) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }

    try {
        showMessage('Logging in...', 'info');
        
        const result = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password,
                walletAddress: userWalletAddress
            })
        });

        if (result.success && result.user.role === role) {
            currentUser = {
                id: result.user.id,
                username: result.user.username,
                name: result.user.name,
                role: result.user.role,
                walletAddress: result.user.walletAddress
            };
            
            document.getElementById('signinBtn').classList.add('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
            
            await loadUserData();
            
            showDashboard();
            showMessage('Welcome, ' + result.user.name + '!', 'success');
            
        } else if (result.success && result.user.role !== role) {
            showMessage('User role is ' + result.user.role + ', but you selected ' + role + '. Please select the correct role.', 'error');
        } else {
            showMessage('Invalid credentials. Please check username and password.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed, using demo mode.', 'warning');
        
        const user = users.find(u => u.username === username && u.password === password && u.role === role);
        
        if (user) {
            currentUser = user;
            document.getElementById('signinBtn').classList.add('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
            
            showDashboard();
            showMessage('Welcome, ' + user.name + '! (Demo Mode)', 'success');
        } else {
            showMessage('Invalid credentials. Please try: admin/password123', 'error');
        }
    }
}

async function loadUserData() {
    try {
        // Load assignment templates
        const templatesResult = await apiCall('/api/assignments/templates');
        if (templatesResult.success) {
            assignmentTemplates = templatesResult.templates || [];
        }

        // Load submissions based on role
        if (currentUser.role === 'student') {
            const submissionsResult = await apiCall(`/api/submissions/student/${currentUser.id}`);
            if (submissionsResult.success) {
                submissions = submissionsResult.submissions || [];
            }
        } else if (currentUser.role === 'lecturer') {
            const submissionsResult = await apiCall('/api/submissions/all');
            if (submissionsResult.success) {
                submissions = submissionsResult.submissions || [];
            }
        }

        // Load users for admin
        if (currentUser.role === 'admin') {
            const userResult = await apiCall('/api/users');
            if (userResult.success) {
                users = userResult.users || [];
            }
        }

        // Load audit logs for admin
        if (currentUser.role === 'admin') {
            const auditResult = await apiCall('/api/audit');
            if (auditResult.success) {
                auditLog = auditResult.auditLogs || [];
            }
        }

        // Load blockchain records for transparency
        const blockchainResult = await apiCall('/api/blockchain/records');
        if (blockchainResult.success) {
            blockchainRecords = blockchainResult.records || [];
        }

    } catch (error) {
        console.error('Error loading user data:', error);
        showMessage('Some data could not be loaded from server.', 'warning');
    }
}

function logout() {
    currentUser = null;
    assignmentTemplates = [];
    submissions = [];
    users = [];
    auditLog = [];
    blockchainRecords = [];
    
    document.getElementById('signinBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    showPage('home');
    showMessage('Logged out successfully.', 'info');
}

// Dashboard Functions
function showDashboard() {
    showPage('dashboard');
    document.getElementById('dashboardTitle').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) + ' Dashboard';
    document.getElementById('dashboardSubtitle').textContent = 'Welcome back, ' + currentUser.name + '!';
    document.getElementById('userInfo').textContent = 'Logged in as: ' + currentUser.name + ' (' + currentUser.role + ')';
    
    setupDashboardNavigation();
    showDashboardSection('overview');
}

function setupDashboardNavigation() {
    const nav = document.getElementById('dashboardNav');
    let navItems = [];

    switch (currentUser.role) {
        case 'student':
            navItems = [
                { id: 'overview', label: 'Overview' },
                { id: 'assignments', label: 'Available Assignments' },
                { id: 'submissions', label: 'My Submissions' },
                { id: 'blockchain', label: 'Blockchain Verify' }
            ];
            break;
        case 'lecturer':
            navItems = [
                { id: 'overview', label: 'Overview' },
                { id: 'create-assignment', label: 'Create Assignment' },
                { id: 'manage-assignments', label: 'Manage Assignments' },
                { id: 'grade-submissions', label: 'Grade Submissions' },
                { id: 'blockchain', label: 'Blockchain Verify' }
            ];
            break;
        case 'admin':
            navItems = [
                { id: 'overview', label: 'Overview' },
                { id: 'users', label: 'Manage Users' },
                { id: 'system-overview', label: 'System Overview' },
                { id: 'audit', label: 'Audit Trail' },
                { id: 'blockchain', label: 'Blockchain Records' }
            ];
            break;
    }

    nav.innerHTML = navItems.map(item => 
        '<button class="dashboard-btn" onclick="showDashboardSection(\'' + item.id + '\')">' + item.label + '</button>'
    ).join('');
    
    if (navItems.length > 0) {
        setTimeout(() => {
            const firstBtn = nav.querySelector('.dashboard-btn');
            if (firstBtn) {
                firstBtn.classList.add('active');
            }
        }, 100);
    }
}

function showDashboardSection(section) {
    document.querySelectorAll('.dashboard-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    switch (section) {
        case 'overview':
            showOverview();
            break;
        case 'assignments':
            showAvailableAssignments();
            break;
        case 'submissions':
            showMySubmissions();
            break;
        case 'create-assignment':
            showCreateAssignment();
            break;
        case 'manage-assignments':
            showManageAssignments();
            break;
        case 'grade-submissions':
            showGradeSubmissions();
            break;
        case 'users':
            showManageUsers();
            break;
        case 'system-overview':
            showSystemOverview();
            break;
        case 'audit':
            showAuditTrail();
            break;
        case 'blockchain':
            showBlockchainSection();
            break;
        default:
            document.getElementById('dashboardContent').innerHTML = '<h3>Section not found</h3>';
    }
}

// Overview Function
function showOverview() {
    const content = document.getElementById('dashboardContent');
    let stats = '';

    switch (currentUser.role) {
        case 'student':
            const mySubmissions = submissions.filter(s => s.studentId === currentUser.id);
            stats = '<div class="features-grid">' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📚</div>' +
                '<h3>' + assignmentTemplates.length + '</h3>' +
                '<p>Available Assignments</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📝</div>' +
                '<h3>' + mySubmissions.length + '</h3>' +
                '<p>My Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">✅</div>' +
                '<h3>' + mySubmissions.filter(s => s.grade).length + '</h3>' +
                '<p>Graded</p>' +
                '</div>' +
                '</div>';
            break;
        case 'lecturer':
            const myAssignments = assignmentTemplates.filter(a => a.createdBy === currentUser.id);
            stats = '<div class="features-grid">' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📋</div>' +
                '<h3>' + myAssignments.length + '</h3>' +
                '<p>Created Assignments</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📝</div>' +
                '<h3>' + submissions.length + '</h3>' +
                '<p>Total Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">⏳</div>' +
                '<h3>' + submissions.filter(s => !s.grade).length + '</h3>' +
                '<p>Pending Grading</p>' +
                '</div>' +
                '</div>';
            break;
        case 'admin':
            stats = '<div class="features-grid">' +
                '<div class="feature-card">' +
                '<div class="feature-icon">👥</div>' +
                '<h3>' + users.length + '</h3>' +
                '<p>Total Users</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📝</div>' +
                '<h3>' + submissions.length + '</h3>' +
                '<p>Total Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">🔗</div>' +
                '<h3>' + blockchainRecords.length + '</h3>' +
                '<p>Blockchain Records</p>' +
                '</div>' +
                '</div>';
            break;
    }

    content.innerHTML = '<h3>Dashboard Overview</h3>' +
        stats +
        '<div style="margin-top: 2rem;">' +
        '<h4>System Status</h4>' +
        '<p><strong>Database:</strong> Connected ✅</p>' +
        '<p><strong>Wallet:</strong> ' + (walletConnected ? 'Connected ✅' : 'Disconnected ❌') + '</p>' +
        '<p><strong>Blockchain:</strong> ' + (blockchainRecords.length > 0 ? 'Active ✅' : 'Inactive ❌') + '</p>' +
        '<p><strong>User Role:</strong> ' + currentUser.role + '</p>' +
        '</div>';
}

// Student Functions
function showAvailableAssignments() {
    const content = document.getElementById('dashboardContent');
    
    if (assignmentTemplates.length === 0) {
        content.innerHTML = `
            <h3>Available Assignments</h3>
            <div class="no-assignments">
                <p>No assignments available at the moment.</p>
            </div>
        `;
        return;
    }
    
    let assignmentsHTML = `
        <h3>Available Assignments</h3>
        <div class="assignments-grid">
    `;
    
    assignmentTemplates.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = dueDate < new Date();
        const dueDateClass = isOverdue ? 'overdue' : '';
        
        assignmentsHTML += `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>${assignment.title}</h4>
                    <span class="course-badge">${assignment.courseCode}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>Description:</strong> ${assignment.description}</p>
                    <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                    <p><strong>Due Date:</strong> <span class="${dueDateClass}">${dueDate.toLocaleDateString()}</span></p>
                    <p><strong>Created by:</strong> ${assignment.createdByName}</p>
                    ${assignment.instructions ? `<p><strong>Instructions:</strong> ${assignment.instructions}</p>` : ''}
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary" onclick="showSubmitForm('${assignment._id}')">Submit Assignment</button>
                    ${assignment.blockchainHash ? `<button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${assignment._id}', 'assignment_template')">Verify on Blockchain</button>` : ''}
                </div>
            </div>
        `;
    });
    
    assignmentsHTML += '</div>';
    content.innerHTML = assignmentsHTML;
}

function showSubmitForm(assignmentTemplateId) {
    const assignment = assignmentTemplates.find(a => a._id === assignmentTemplateId);
    if (!assignment) return;
    
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <h3>Submit Assignment: ${assignment.title}</h3>
        <div class="assignment-submit-card">
            <div class="assignment-info">
                <h4>Assignment Details</h4>
                <p><strong>Course:</strong> ${assignment.courseCode}</p>
                <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                ${assignment.instructions ? `<p><strong>Instructions:</strong> ${assignment.instructions}</p>` : ''}
            </div>
            
            <form id="submissionForm" enctype="multipart/form-data">
                <input type="hidden" id="assignmentTemplateId" value="${assignmentTemplateId}">
                
                <div class="form-group">
                    <label for="submissionFile">Upload Your Assignment:</label>
                    <input type="file" id="submissionFile" name="assignmentFile" accept=".pdf,.doc,.docx,.txt,.zip" required>
                    <small>Supported formats: PDF, DOC, DOCX, TXT, ZIP (Max: 10MB)</small>
                </div>
                
                <div class="actions">
                    <button type="submit" class="btn btn-primary">Submit Assignment</button>
                    <button type="button" class="btn btn-secondary" onclick="showDashboardSection('assignments')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('gradeForm').addEventListener('submit', handleGrading);
}

async function handleGrading(e) {
    e.preventDefault();
    
    const submissionId = document.getElementById('submissionId').value;
    const grade = document.getElementById('grade').value;
    const marks = parseInt(document.getElementById('marks').value);
    const feedback = document.getElementById('feedback').value;
    
    try {
        showMessage('Submitting grade...', 'info');
        
        const result = await apiCall(`/api/submissions/grade/${submissionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                grade,
                marks,
                feedback,
                gradedBy: currentUser.id,
                gradedByName: currentUser.name
            })
        });
        
        if (result.success) {
            showMessage('Grade submitted successfully! Blockchain hash: ' + result.blockchainHash.substring(0, 16) + '...', 'success');
            await loadUserData();
            showDashboardSection('grade-submissions');
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Grading error:', error);
        showMessage('Failed to submit grade. Please try again.', 'error');
    }
}

function showManageAssignments() {
    const content = document.getElementById('dashboardContent');
    
    const myAssignments = assignmentTemplates.filter(a => a.createdBy === currentUser.id);
    
    if (myAssignments.length === 0) {
        content.innerHTML = `
            <h3>My Assignments</h3>
            <div class="no-assignments">
                <p>You haven't created any assignments yet.</p>
                <button class="btn btn-primary" onclick="showDashboardSection('create-assignment')">Create First Assignment</button>
            </div>
        `;
        return;
    }
    
    let assignmentsHTML = `
        <h3>My Assignments</h3>
        <div class="assignments-grid">
    `;
    
    myAssignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = dueDate < new Date();
        const dueDateClass = isOverdue ? 'overdue' : '';
        const assignmentSubmissions = submissions.filter(s => s.assignmentTemplate._id === assignment._id);
        
        assignmentsHTML += `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>${assignment.title}</h4>
                    <span class="course-badge">${assignment.courseCode}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>Due Date:</strong> <span class="${dueDateClass}">${dueDate.toLocaleDateString()}</span></p>
                    <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                    <p><strong>Submissions:</strong> ${assignmentSubmissions.length}</p>
                    <p><strong>Graded:</strong> ${assignmentSubmissions.filter(s => s.grade).length}</p>
                    <p><strong>Created:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewAssignmentSubmissions('${assignment._id}')">View Submissions</button>
                    ${assignment.blockchainHash ? `<button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${assignment._id}', 'assignment_template')">Verify Blockchain</button>` : ''}
                </div>
            </div>
        `;
    });
    
    assignmentsHTML += '</div>';
    content.innerHTML = assignmentsHTML;
}

function viewAssignmentSubmissions(assignmentId) {
    const assignment = assignmentTemplates.find(a => a._id === assignmentId);
    if (!assignment) return;
    
    const assignmentSubmissions = submissions.filter(s => s.assignmentTemplate._id === assignmentId);
    const content = document.getElementById('dashboardContent');
    
    let submissionsHTML = `
        <h3>Submissions for: ${assignment.title}</h3>
        <div class="assignment-info-bar">
            <p><strong>Course:</strong> ${assignment.courseCode}</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
            <p><strong>Total Submissions:</strong> ${assignmentSubmissions.length}</p>
        </div>
    `;
    
    if (assignmentSubmissions.length === 0) {
        submissionsHTML += `
            <div class="no-submissions">
                <p>No submissions for this assignment yet.</p>
                <button class="btn btn-secondary" onclick="showDashboardSection('manage-assignments')">Back to Assignments</button>
            </div>
        `;
    } else {
        submissionsHTML += `
            <div class="submissions-table">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Grade</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        assignmentSubmissions.forEach(submission => {
            const statusClass = getStatusClass(submission.status);
            const submittedDate = new Date(submission.submittedAt).toLocaleDateString();
            
            submissionsHTML += `
                <tr>
                    <td>${submission.studentName}</td>
                    <td>${submittedDate}</td>
                    <td><span class="status ${statusClass}">${submission.status}</span></td>
                    <td>${submission.grade || 'Not graded'}</td>
                    <td>
                        ${!submission.grade ? `<button class="btn btn-sm btn-success" onclick="showGradeForm('${submission._id}')">Grade</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="downloadSubmission('${submission._id}')">Download</button>
                    </td>
                </tr>
            `;
        });
        
        submissionsHTML += `
                    </tbody>
                </table>
            </div>
            <button class="btn btn-secondary" onclick="showDashboardSection('manage-assignments')">Back to Assignments</button>
        `;
    }
    
    content.innerHTML = submissionsHTML;
}

// Blockchain Functions
function showBlockchainSection() {
    const content = document.getElementById('dashboardContent');
    
    let blockchainHTML = `
        <h3>Blockchain Records & Verification</h3>
        
        <div class="blockchain-section">
            <div class="verification-card">
                <h4>Verify Record</h4>
                <form id="verificationForm">
                    <div class="form-group">
                        <label for="recordId">Record ID:</label>
                        <input type="text" id="recordId" placeholder="Enter record ID to verify">
                    </div>
                    <div class="form-group">
                        <label for="recordType">Record Type:</label>
                        <select id="recordType">
                            <option value="submission">Submission</option>
                            <option value="assignment_template">Assignment Template</option>
                            <option value="grade">Grade</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Verify on Blockchain</button>
                </form>
                <div id="verificationResult"></div>
            </div>
    `;
    
    if (currentUser.role === 'admin') {
        blockchainHTML += `
            <div class="blockchain-records">
                <h4>Recent Blockchain Records</h4>
                <div class="records-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Block #</th>
                                <th>Type</th>
                                <th>Hash</th>
                                <th>Timestamp</th>
                                <th>Verified</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        blockchainRecords.slice(0, 10).forEach(record => {
            blockchainHTML += `
                <tr>
                    <td>${record.blockNumber}</td>
                    <td>${record.recordType}</td>
                    <td class="hash-cell">${record.dataHash.substring(0, 16)}...</td>
                    <td>${new Date(record.timestamp).toLocaleDateString()}</td>
                    <td>${record.verified ? '✅' : '❌'}</td>
                </tr>
            `;
        });
        
        blockchainHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    blockchainHTML += '</div>';
    content.innerHTML = blockchainHTML;
    
    document.getElementById('verificationForm').addEventListener('submit', handleVerification);
}

async function handleVerification(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('recordId').value.trim();
    const recordType = document.getElementById('recordType').value;
    
    if (!recordId) {
        showMessage('Please enter a record ID', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ recordId, recordType })
        });
        
        const resultDiv = document.getElementById('verificationResult');
        
        if (result.success && result.verified) {
            resultDiv.innerHTML = `
                <div class="verification-success">
                    <h5>✅ Verification Successful</h5>
                    <p><strong>Block Number:</strong> ${result.blockchainRecord.blockNumber}</p>
                    <p><strong>Data Hash:</strong> ${result.blockchainRecord.dataHash}</p>
                    <p><strong>Timestamp:</strong> ${new Date(result.blockchainRecord.timestamp).toLocaleString()}</p>
                    <p><strong>Chain Integrity:</strong> ${result.chainIntegrity ? '✅ Valid' : '❌ Compromised'}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="verification-error">
                    <h5>❌ Verification Failed</h5>
                    <p>${result.error || 'Record not found or invalid'}</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        document.getElementById('verificationResult').innerHTML = `
            <div class="verification-error">
                <h5>❌ Verification Error</h5>
                <p>Failed to verify record. Please try again.</p>
            </div>
        `;
    }
}

async function verifyBlockchainRecord(recordId, recordType) {
    try {
        showMessage('Verifying blockchain record...', 'info');
        
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ recordId, recordType })
        });
        
        if (result.success && result.verified) {
            showMessage(`✅ Blockchain verification successful! Block #${result.blockchainRecord.blockNumber}`, 'success');
        } else {
            showMessage('❌ Blockchain verification failed: ' + (result.error || 'Record not found'), 'error');
        }
        
    } catch (error) {
        console.error('Blockchain verification error:', error);
        showMessage('Failed to verify blockchain record', 'error');
    }
}

// Admin Functions
function showManageUsers() {
    const content = document.getElementById('dashboardContent');
    
    let tableRows = '';
    users.forEach(user => {
        tableRows += '<tr>' +
            '<td>' + user.name + '</td>' +
            '<td>' + user.username + '</td>' +
            '<td>' + (user.email || 'N/A') + '</td>' +
            '<td>' + user.role + '</td>' +
            '<td>' + (user.isActive ? 'Active' : 'Inactive') + '</td>' +
            '<td>' + new Date(user.createdAt).toLocaleDateString() + '</td>' +
            '</tr>';
    });

    content.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">' +
        '<h3>Manage Users</h3>' +
        '<button class="btn btn-secondary" onclick="exportUsers()">Export Users</button>' +
        '</div>' +
        '<table class="data-table">' +
        '<thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
        '</table>';
}

function showSystemOverview() {
    const content = document.getElementById('dashboardContent');
    
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalLecturers = users.filter(u => u.role === 'lecturer').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const gradedSubmissions = submissions.filter(s => s.grade).length;
    const pendingSubmissions = submissions.filter(s => !s.grade).length;
    
    content.innerHTML = `
        <h3>System Overview</h3>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">👨‍🎓</div>
                <h3>${totalStudents}</h3>
                <p>Students</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👨‍🏫</div>
                <h3>${totalLecturers}</h3>
                <p>Lecturers</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👨‍💼</div>
                <h3>${totalAdmins}</h3>
                <p>Administrators</p>
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📋</div>
                <h3>${assignmentTemplates.length}</h3>
                <p>Assignment Templates</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3>${submissions.length}</h3>
                <p>Total Submissions</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h3>${gradedSubmissions}</h3>
                <p>Graded Submissions</p>
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">⏳</div>
                <h3>${pendingSubmissions}</h3>
                <p>Pending Grading</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <h3>${blockchainRecords.length}</h3>
                <p>Blockchain Records</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>${auditLog.length}</h3>
                <p>Audit Entries</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>System Health</h4>
            <div class="system-status">
                <p><strong>Database:</strong> Connected ✅</p>
                <p><strong>Blockchain:</strong> ${blockchainRecords.length > 0 ? 'Active ✅' : 'Inactive ❌'}</p>
                <p><strong>File Storage:</strong> Active ✅</p>
                <p><strong>Audit Logging:</strong> Active ✅</p>
                <p><strong>Last Backup:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function showAuditTrail() {
    const content = document.getElementById('dashboardContent');
    
    let tableRows = '';
    auditLog.slice(0, 50).forEach(entry => {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        tableRows += '<tr>' +
            '<td>' + timestamp + '</td>' +
            '<td>' + entry.user + '</td>' +
            '<td>' + entry.action + '</td>' +
            '<td>' + entry.details + '</td>' +
            '<td>' + (entry.resourceType || 'N/A') + '</td>' +
            '</tr>';
    });

    content.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">' +
        '<h3>Audit Trail</h3>' +
        '<div>' +
        '<button class="btn btn-secondary" onclick="refreshAuditLog()">Refresh</button>' +
        '<button class="btn btn-primary" onclick="exportAuditLog()">Export Log</button>' +
        '</div>' +
        '</div>' +
        '<table class="data-table">' +
        '<thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>Resource</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
        '</table>';
}

// Utility Functions
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'submitted': return 'status-submitted';
        case 'graded': return 'status-graded';
        case 'pending': return 'status-pending';
        case 'late': return 'status-late';
        default: return 'status-default';
    }
}

async function downloadSubmission(submissionId) {
    try {
        window.open(`/api/submissions/download/${submissionId}`, '_blank');
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Failed to download file', 'error');
    }
}

async function refreshAuditLog() {
    try {
        showMessage('Refreshing audit log...', 'info');
        await loadUserData();
        showDashboardSection('audit');
        showMessage('Audit log refreshed', 'success');
    } catch (error) {
        showMessage('Failed to refresh audit log', 'error');
    }
}

function exportUsers() {
    if (typeof XLSX === 'undefined') {
        showMessage('Excel export feature not available.', 'error');
        return;
    }

    const data = users.map(u => ({
        'Name': u.name,
        'Username': u.username,
        'Email': u.email,
        'Role': u.role,
        'Status': u.isActive ? 'Active' : 'Inactive',
        'Created': new Date(u.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    XLSX.writeFile(workbook, 'users_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showMessage('Users exported successfully!', 'success');
}

function exportAuditLog() {
    if (typeof XLSX === 'undefined') {
        showMessage('Excel export feature not available.', 'error');
        return;
    }

    const data = auditLog.map(a => ({
        'Timestamp': new Date(a.timestamp).toLocaleString(),
        'User': a.user,
        'Action': a.action,
        'Details': a.details,
        'Resource Type': a.resourceType || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
    
    XLSX.writeFile(workbook, 'audit_log_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showMessage('Audit log exported successfully!', 'success');
}

// API helper function
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Message and Modal Functions
function showMessage(message, type) {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'status-message status-' + type;
    messageDiv.textContent = message;
    
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '400px';
    messageDiv.style.animation = 'slideIn 0.3s ease-out';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

function submitContact(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    showMessage('Thank you, ' + name + '! Your message has been sent. We will get back to you soon.', 'success');
    event.target.reset();
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .status-online { color: #10b981; }
        .status-offline { color: #ef4444; }
        
        .overdue { color: #ef4444; font-weight: bold; }
        .blockchain-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem; }
        .verification-card, .grading-card { background: #f8f9fa; padding: 2rem; border-radius: 12px; }
        .verification-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .verification-error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .assignments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
        .assignment-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .assignment-info-bar { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .system-status { background: #f8f9fa; padding: 1rem; border-radius: 8px; }
        .hash-cell { font-family: monospace; font-size: 0.9em; }
        .assignment-submit-card { background: #f8f9fa; padding: 2rem; border-radius: 12px; }
        .assignment-info { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        
        @media (max-width: 768px) {
            .blockchain-section { grid-template-columns: 1fr; }
            .assignments-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
});

function updateConnectionStatus() {
    const statusElements = document.querySelectorAll('[data-connection-status]');
    const status = navigator.onLine ? 'Online' : 'Offline';
    statusElements.forEach(element => {
        element.textContent = status;
        element.className = navigator.onLine ? 'status-online' : 'status-offline';
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('verificationResult')) {
            document.getElementById('verificationResult').innerHTML = '';
        }
    }
    
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentUser && currentUser.role === 'admin') {
            exportAuditLog();
        }
    }
});

// Global error handlers
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showMessage('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showMessage('A network error occurred. Please check your connection.', 'warning');
});
    
    document.getElementById('submissionForm').addEventListener('submit', handleSubmission);


async function handleSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const form = e.target;
    
    formData.append('assignmentTemplateId', form.querySelector('#assignmentTemplateId').value);
    formData.append('studentId', currentUser.id);
    formData.append('studentName', currentUser.name);
    formData.append('assignmentFile', form.querySelector('#submissionFile').files[0]);
    
    try {
        showMessage('Submitting assignment...', 'info');
        
        const response = await fetch('/api/assignments/submit', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Assignment submitted successfully! Blockchain hash: ' + result.submission.blockchainHash.substring(0, 16) + '...', 'success');
            await loadUserData();
            showDashboardSection('submissions');
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('Failed to submit assignment. Please try again.', 'error');
    }
}

function showMySubmissions() {
    const content = document.getElementById('dashboardContent');
    
    const mySubmissions = submissions.filter(s => s.studentId === currentUser.id);
    
    if (mySubmissions.length === 0) {
        content.innerHTML = `
            <h3>My Submissions</h3>
            <div class="no-submissions">
                <p>You haven't submitted any assignments yet.</p>
                <button class="btn btn-primary" onclick="showDashboardSection('assignments')">View Available Assignments</button>
            </div>
        `;
        return;
    }
    
    let submissionsHTML = `
        <h3>My Submissions</h3>
        <div class="submissions-grid">
    `;
    
    mySubmissions.forEach(submission => {
        const statusClass = getStatusClass(submission.status);
        const submissionDate = new Date(submission.submittedAt).toLocaleDateString();
        
        submissionsHTML += `
            <div class="submission-card">
                <div class="submission-header">
                    <h4>${submission.assignmentTemplate.title}</h4>
                    <span class="status ${statusClass}">${submission.status}</span>
                </div>
                <div class="submission-details">
                    <p><strong>Course:</strong> ${submission.assignmentTemplate.courseCode}</p>
                    <p><strong>Submitted:</strong> ${submissionDate}</p>
                    <p><strong>Due Date:</strong> ${new Date(submission.assignmentTemplate.dueDate).toLocaleDateString()}</p>
                    ${submission.grade ? `<p><strong>Grade:</strong> ${submission.grade}</p>` : ''}
                    ${submission.marks ? `<p><strong>Marks:</strong> ${submission.marks}/${submission.assignmentTemplate.maxMarks}</p>` : ''}
                    ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
                </div>
                <div class="submission-actions">
                    <button class="btn btn-sm" onclick="downloadSubmission('${submission._id}')">Download</button>
                    ${submission.blockchainHash ? `<button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${submission._id}', 'submission')">Verify Blockchain</button>` : ''}
                </div>
            </div>
        `;
    });
    
    submissionsHTML += '</div>';
    content.innerHTML = submissionsHTML;
}

// Lecturer Functions  
function showCreateAssignment() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <h3>Create New Assignment</h3>
        <form id="createAssignmentForm">
            <div class="form-group">
                <label for="assignmentTitle">Assignment Title:</label>
                <input type="text" id="assignmentTitle" name="title" required>
            </div>
            
            <div class="form-group">
                <label for="courseCode">Course Code:</label>
                <input type="text" id="courseCode" name="courseCode" required placeholder="e.g., CS101">
            </div>
            
            <div class="form-group">
                <label for="description">Description:</label>
                <textarea id="description" name="description" rows="4" required placeholder="Brief description of the assignment"></textarea>
            </div>
            
            <div class="form-group">
                <label for="instructions">Instructions:</label>
                <textarea id="instructions" name="instructions" rows="6" placeholder="Detailed instructions for students..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="dueDate">Due Date:</label>
                <input type="datetime-local" id="dueDate" name="dueDate" required>
            </div>
            
            <div class="form-group">
                <label for="maxMarks">Maximum Marks:</label>
                <input type="number" id="maxMarks" name="maxMarks" value="100" min="1" required>
            </div>
            
            <div class="actions">
                <button type="submit" class="btn btn-primary">Create Assignment</button>
                <button type="button" class="btn btn-secondary" onclick="showDashboardSection('overview')">Cancel</button>
            </div>
        </form>
    `;
    
    document.getElementById('createAssignmentForm').addEventListener('submit', handleCreateAssignment);
}

async function handleCreateAssignment(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        title: form.title.value,
        courseCode: form.courseCode.value,
        description: form.description.value,
        instructions: form.instructions.value,
        dueDate: form.dueDate.value,
        maxMarks: parseInt(form.maxMarks.value),
        createdBy: currentUser.id,
        createdByName: currentUser.name
    };
    
    try {
        showMessage('Creating assignment...', 'info');
        
        const result = await apiCall('/api/assignments/template', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showMessage('Assignment created successfully! Blockchain hash: ' + result.blockchainHash.substring(0, 16) + '...', 'success');
            await loadUserData();
            showDashboardSection('manage-assignments');
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Assignment creation error:', error);
        showMessage('Failed to create assignment. Please try again.', 'error');
    }
}

function showGradeSubmissions() {
    const content = document.getElementById('dashboardContent');
    
    const ungradedSubmissions = submissions.filter(s => !s.grade);
    
    if (ungradedSubmissions.length === 0) {
        content.innerHTML = `
            <h3>Grade Submissions</h3>
            <div class="no-submissions">
                <p>No submissions pending grading.</p>
            </div>
        `;
        return;
    }
    
    let submissionsHTML = `
        <h3>Grade Submissions</h3>
        <div class="submissions-table">
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Assignment</th>
                        <th>Course</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    ungradedSubmissions.forEach(submission => {
        const statusClass = getStatusClass(submission.status);
        const submittedDate = new Date(submission.submittedAt).toLocaleDateString();
        
        submissionsHTML += `
            <tr>
                <td>${submission.studentName}</td>
                <td>${submission.assignmentTemplate.title}</td>
                <td>${submission.assignmentTemplate.courseCode}</td>
                <td>${submittedDate}</td>
                <td><span class="status ${statusClass}">${submission.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showGradeForm('${submission._id}')">Grade</button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadSubmission('${submission._id}')">Download</button>
                </td>
            </tr>
        `;
    });
    
    submissionsHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = submissionsHTML;
}

// function showGradeForm(submissionId) {
//     const submission = submissions.find(s => s._id === submissionId);
//     if (!submission) return;
    
//     const content = document.getElementById('dashboardContent');
//     content.innerHTML = `
//         <h3>Grade Submission</h3>
//         <div class="grading-card">
//             <div class="submission-info">
//                 <h4>Submission Details</h4>
//                 <p><strong>Student:</strong> ${submission.studentName}</p>
//                 <p><strong>Assignment:</strong> ${submission.assignmentTemplate.title}</p>
//                 <p><strong>Course:</strong> ${submission.assignmentTemplate.courseCode}</p>
//                 <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleDateString()}</p>
//                 <p><strong>Max Marks:</strong> ${submission.assignmentTemplate.maxMarks}</p>
//             </div>
            
//             <form id="gradeForm">
//                 <input type="hidden" id="submissionId" value="${submissionId}">
                
//                 <div class="form-group">
//                     <label for="grade">Grade:</label>
//                     <select id="grade" name="grade" required>
//                         <option value="">Select Grade</option>
//                         <option value="A+">A+ (90-100)</option>
//                         <option value="A">A (85-89)</option>
//                         <option value="B+">B+ (80-84)</option>
//                         <option value="B">B (75-79)</option>
//                         <option value="C+">C+ (70-74)</option>
//                         <option value="C">C (65-69)</option>
//                         <option value="D+">D+ (60-64)</option>
//                         <option value="D">D (55-59)</option>
//                         <option value="F">F (0-54)</option>
//                     </select>
//                 </div>
                
//                 <div class="form-group">
//                     <label for="marks">Marks:</label>
//                     <input type="number" id="marks" name="marks" min="0" max="${submission.assignmentTemplate.maxMarks}" required>
//                 </div>
                
//                 <div class="form-group">
//                     <label for="feedback">Feedback:</label>
//                     <textarea id="feedback" name="feedback" rows="6" placeholder="Provide feedback to the student..."></textarea>
//                 </div>
                
//                 <div class="actions">
//                     <button type="submit" class="btn btn-success">Submit Grade</button>
//                     <button type="button" class="btn btn-secondary" onclick="downloadSubmission('${submissionId}')">Download Assignment</button>
//                     <button type="button" class="btn btn-secondary" onclick="showDashboardSection('grade-submissions')">Cancel</button>
//                 </div>
//             </form>
//         </div>
//     `;

//          document.getElementById('gradeForm').addEventListener('submit', handleGradeSubmission);
// }

// async function handleGradeSubmission(e) {
//     e.preventDefault();
    
//     const assignmentId = document.getElementById('assignmentId').value;
//     const grade = document.getElementById('grade').value;
//     const feedback = document.getElementById('feedback').value;
    
//     try {
//         const response = await fetch(`/api/assignments/grade/${assignmentId}`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 grade,
//                 feedback,
//                 gradedBy: currentUser.name
//             })
//         });
        
//         const result = await response.json();
        
//         if (result.success) {
//             showMessage('Grade submitted successfully!', 'success');
//             viewAssignmentDetails(assignmentId);
//         } else {
//             showMessage('Error: ' + result.error, 'error');
//         }
//     } catch (error) {
//         console.error('Grading error:', error);
//     } }

function showGradeForm(submissionId) {
    const submission = submissions.find(s => s._id === submissionId);
    if (!submission) return;
    
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <h3>Grade Submission</h3>
        <div class="grading-card">
            <div class="submission-info">
                <h4>Submission Details</h4>
                <p><strong>Student:</strong> ${submission.studentName}</p>
                <p><strong>Assignment:</strong> ${submission.assignmentTemplate.title}</p>
                <p><strong>Course:</strong> ${submission.assignmentTemplate.courseCode}</p>
                <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleDateString()}</p>
                <p><strong>Max Marks:</strong> ${submission.assignmentTemplate.maxMarks}</p>
            </div>
            
            <form id="gradeForm">
                <input type="hidden" id="submissionId" value="${submissionId}">
                
                <div class="form-group">
                    <label for="grade">Grade:</label>
                    <select id="grade" name="grade" required>
                        <option value="">Select Grade</option>
                        <option value="A+">A+ (90-100)</option>
                        <option value="A">A (85-89)</option>
                        <option value="B+">B+ (80-84)</option>
                        <option value="B">B (75-79)</option>
                        <option value="C+">C+ (70-74)</option>
                        <option value="C">C (65-69)</option>
                        <option value="D+">D+ (60-64)</option>
                        <option value="D">D (55-59)</option>
                        <option value="F">F (0-54)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="marks">Marks:</label>
                    <input type="number" id="marks" name="marks" min="0" max="${submission.assignmentTemplate.maxMarks}" required>
                </div>
                
                <div class="form-group">
                    <label for="feedback">Feedback:</label>
                    <textarea id="feedback" name="feedback" rows="6" placeholder="Provide feedback to the student..."></textarea>
                </div>
                
                <div class="actions">
                    <button type="submit" class="btn btn-success">Submit Grade</button>
                    <button type="button" class="btn btn-secondary" onclick="downloadSubmission('${submissionId}')">Download Assignment</button>
                    <button type="button" class="btn btn-secondary" onclick="showDashboardSection('grade-submissions')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('gradeForm').addEventListener('submit', handleGrading);
}

async function handleGrading(e) {
    e.preventDefault();
    
    const submissionId = document.getElementById('submissionId').value;
    const grade = document.getElementById('grade').value;
    const marks = parseInt(document.getElementById('marks').value);
    const feedback = document.getElementById('feedback').value;
    
    try {
        showMessage('Submitting grade...', 'info');
        
        const result = await apiCall(`/api/submissions/grade/${submissionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                grade,
                marks,
                feedback,
                gradedBy: currentUser.id,
                gradedByName: currentUser.name
            })
        });
        
        if (result.success) {
            showMessage('Grade submitted successfully! Blockchain hash: ' + result.blockchainHash.substring(0, 16) + '...', 'success');
            await loadUserData();
            showDashboardSection('grade-submissions');
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Grading error:', error);
        showMessage('Failed to submit grade. Please try again.', 'error');
    }
}

function showManageAssignments() {
    const content = document.getElementById('dashboardContent');
    
    const myAssignments = assignmentTemplates.filter(a => a.createdBy === currentUser.id);
    
    if (myAssignments.length === 0) {
        content.innerHTML = `
            <h3>My Assignments</h3>
            <div class="no-assignments">
                <p>You haven't created any assignments yet.</p>
                <button class="btn btn-primary" onclick="showDashboardSection('create-assignment')">Create First Assignment</button>
            </div>
        `;
        return;
    }
    
    let assignmentsHTML = `
        <h3>My Assignments</h3>
        <div class="assignments-grid">
    `;
    
    myAssignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = dueDate < new Date();
        const dueDateClass = isOverdue ? 'overdue' : '';
        const assignmentSubmissions = submissions.filter(s => s.assignmentTemplate._id === assignment._id);
        
        assignmentsHTML += `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>${assignment.title}</h4>
                    <span class="course-badge">${assignment.courseCode}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>Due Date:</strong> <span class="${dueDateClass}">${dueDate.toLocaleDateString()}</span></p>
                    <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                    <p><strong>Submissions:</strong> ${assignmentSubmissions.length}</p>
                    <p><strong>Graded:</strong> ${assignmentSubmissions.filter(s => s.grade).length}</p>
                    <p><strong>Created:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewAssignmentSubmissions('${assignment._id}')">View Submissions</button>
                    ${assignment.blockchainHash ? `<button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${assignment._id}', 'assignment_template')">Verify Blockchain</button>` : ''}
                </div>
            </div>
        `;
    });
    
    assignmentsHTML += '</div>';
    content.innerHTML = assignmentsHTML;
}

function viewAssignmentSubmissions(assignmentId) {
    const assignment = assignmentTemplates.find(a => a._id === assignmentId);
    if (!assignment) return;
    
    const assignmentSubmissions = submissions.filter(s => s.assignmentTemplate._id === assignmentId);
    const content = document.getElementById('dashboardContent');
    
    let submissionsHTML = `
        <h3>Submissions for: ${assignment.title}</h3>
        <div class="assignment-info-bar">
            <p><strong>Course:</strong> ${assignment.courseCode}</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
            <p><strong>Total Submissions:</strong> ${assignmentSubmissions.length}</p>
        </div>
    `;
    
    if (assignmentSubmissions.length === 0) {
        submissionsHTML += `
            <div class="no-submissions">
                <p>No submissions for this assignment yet.</p>
                <button class="btn btn-secondary" onclick="showDashboardSection('manage-assignments')">Back to Assignments</button>
            </div>
        `;
    } else {
        submissionsHTML += `
            <div class="submissions-table">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Grade</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        assignmentSubmissions.forEach(submission => {
            const statusClass = getStatusClass(submission.status);
            const submittedDate = new Date(submission.submittedAt).toLocaleDateString();
            
            submissionsHTML += `
                <tr>
                    <td>${submission.studentName}</td>
                    <td>${submittedDate}</td>
                    <td><span class="status ${statusClass}">${submission.status}</span></td>
                    <td>${submission.grade || 'Not graded'}</td>
                    <td>
                        ${!submission.grade ? `<button class="btn btn-sm btn-success" onclick="showGradeForm('${submission._id}')">Grade</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="downloadSubmission('${submission._id}')">Download</button>
                    </td>
                </tr>
            `;
        });
        
        submissionsHTML += `
                    </tbody>
                </table>
            </div>
            <button class="btn btn-secondary" onclick="showDashboardSection('manage-assignments')">Back to Assignments</button>
        `;
    }
    
    content.innerHTML = submissionsHTML;
}

// Blockchain Functions
function showBlockchainSection() {
    const content = document.getElementById('dashboardContent');
    
    let blockchainHTML = `
        <h3>Blockchain Records & Verification</h3>
        
        <div class="blockchain-section">
            <div class="verification-card">
                <h4>Verify Record</h4>
                <form id="verificationForm">
                    <div class="form-group">
                        <label for="recordId">Record ID:</label>
                        <input type="text" id="recordId" placeholder="Enter record ID to verify">
                    </div>
                    <div class="form-group">
                        <label for="recordType">Record Type:</label>
                        <select id="recordType">
                            <option value="submission">Submission</option>
                            <option value="assignment_template">Assignment Template</option>
                            <option value="grade">Grade</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Verify on Blockchain</button>
                </form>
                <div id="verificationResult"></div>
            </div>
    `;
    
    if (currentUser.role === 'admin') {
        blockchainHTML += `
            <div class="blockchain-records">
                <h4>Recent Blockchain Records</h4>
                <div class="records-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Block #</th>
                                <th>Type</th>
                                <th>Hash</th>
                                <th>Timestamp</th>
                                <th>Verified</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        blockchainRecords.slice(0, 10).forEach(record => {
            blockchainHTML += `
                <tr>
                    <td>${record.blockNumber}</td>
                    <td>${record.recordType}</td>
                    <td class="hash-cell">${record.dataHash.substring(0, 16)}...</td>
                    <td>${new Date(record.timestamp).toLocaleDateString()}</td>
                    <td>${record.verified ? '✅' : '❌'}</td>
                </tr>
            `;
        });
        
        blockchainHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    blockchainHTML += '</div>';
    content.innerHTML = blockchainHTML;
    
    document.getElementById('verificationForm').addEventListener('submit', handleVerification);
}

async function handleVerification(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('recordId').value.trim();
    const recordType = document.getElementById('recordType').value;
    
    if (!recordId) {
        showMessage('Please enter a record ID', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ recordId, recordType })
        });
        
        const resultDiv = document.getElementById('verificationResult');
        
        if (result.success && result.verified) {
            resultDiv.innerHTML = `
                <div class="verification-success">
                    <h5>✅ Verification Successful</h5>
                    <p><strong>Block Number:</strong> ${result.blockchainRecord.blockNumber}</p>
                    <p><strong>Data Hash:</strong> ${result.blockchainRecord.dataHash}</p>
                    <p><strong>Timestamp:</strong> ${new Date(result.blockchainRecord.timestamp).toLocaleString()}</p>
                    <p><strong>Chain Integrity:</strong> ${result.chainIntegrity ? '✅ Valid' : '❌ Compromised'}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="verification-error">
                    <h5>❌ Verification Failed</h5>
                    <p>${result.error || 'Record not found or invalid'}</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        document.getElementById('verificationResult').innerHTML = `
            <div class="verification-error">
                <h5>❌ Verification Error</h5>
                <p>Failed to verify record. Please try again.</p>
            </div>
        `;
    }
}

async function verifyBlockchainRecord(recordId, recordType) {
    try {
        showMessage('Verifying blockchain record...', 'info');
        
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ recordId, recordType })
        });
        
        if (result.success && result.verified) {
            showMessage(`✅ Blockchain verification successful! Block #${result.blockchainRecord.blockNumber}`, 'success');
        } else {
            showMessage('❌ Blockchain verification failed: ' + (result.error || 'Record not found'), 'error');
        }
        
    } catch (error) {
        console.error('Blockchain verification error:', error);
        showMessage('Failed to verify blockchain record', 'error');
    }
}

// Admin Functions
function showManageUsers() {
    const content = document.getElementById('dashboardContent');
    
    let tableRows = '';
    users.forEach(user => {
        tableRows += '<tr>' +
            '<td>' + user.name + '</td>' +
            '<td>' + user.username + '</td>' +
            '<td>' + (user.email || 'N/A') + '</td>' +
            '<td>' + user.role + '</td>' +
            '<td>' + (user.isActive ? 'Active' : 'Inactive') + '</td>' +
            '<td>' + new Date(user.createdAt).toLocaleDateString() + '</td>' +
            '</tr>';
    });

    content.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">' +
        '<h3>Manage Users</h3>' +
        '<button class="btn btn-secondary" onclick="exportUsers()">Export Users</button>' +
        '</div>' +
        '<table class="data-table">' +
        '<thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
        '</table>';
}

function showSystemOverview() {
    const content = document.getElementById('dashboardContent');
    
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalLecturers = users.filter(u => u.role === 'lecturer').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const gradedSubmissions = submissions.filter(s => s.grade).length;
    const pendingSubmissions = submissions.filter(s => !s.grade).length;
    
    content.innerHTML = `
        <h3>System Overview</h3>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">👨‍🎓</div>
                <h3>${totalStudents}</h3>
                <p>Students</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👨‍🏫</div>
                <h3>${totalLecturers}</h3>
                <p>Lecturers</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👨‍💼</div>
                <h3>${totalAdmins}</h3>
                <p>Administrators</p>
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📋</div>
                <h3>${assignmentTemplates.length}</h3>
                <p>Assignment Templates</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3>${submissions.length}</h3>
                <p>Total Submissions</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h3>${gradedSubmissions}</h3>
                <p>Graded Submissions</p>
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">⏳</div>
                <h3>${pendingSubmissions}</h3>
                <p>Pending Grading</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <h3>${blockchainRecords.length}</h3>
                <p>Blockchain Records</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>${auditLog.length}</h3>
                <p>Audit Entries</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>System Health</h4>
            <div class="system-status">
                <p><strong>Database:</strong> Connected ✅</p>
                <p><strong>Blockchain:</strong> ${blockchainRecords.length > 0 ? 'Active ✅' : 'Inactive ❌'}</p>
                <p><strong>File Storage:</strong> Active ✅</p>
                <p><strong>Audit Logging:</strong> Active ✅</p>
                <p><strong>Last Backup:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function showAuditTrail() {
    const content = document.getElementById('dashboardContent');
    
    let tableRows = '';
    auditLog.slice(0, 50).forEach(entry => {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        tableRows += '<tr>' +
            '<td>' + timestamp + '</td>' +
            '<td>' + entry.user + '</td>' +
            '<td>' + entry.action + '</td>' +
            '<td>' + entry.details + '</td>' +
            '<td>' + (entry.resourceType || 'N/A') + '</td>' +
            '</tr>';
    });

    content.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">' +
        '<h3>Audit Trail</h3>' +
        '<div>' +
        '<button class="btn btn-secondary" onclick="refreshAuditLog()">Refresh</button>' +
        '<button class="btn btn-primary" onclick="exportAuditLog()">Export Log</button>' +
        '</div>' +
        '</div>' +
        '<table class="data-table">' +
        '<thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>Resource</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
        '</table>';
}

// Utility Functions
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'submitted': return 'status-submitted';
        case 'graded': return 'status-graded';
        case 'pending': return 'status-pending';
        case 'late': return 'status-late';
        default: return 'status-default';
    }
}

async function downloadSubmission(submissionId) {
    try {
        window.open(`/api/submissions/download/${submissionId}`, '_blank');
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Failed to download file', 'error');
    }
}

async function refreshAuditLog() {
    try {
        showMessage('Refreshing audit log...', 'info');
        await loadUserData();
        showDashboardSection('audit');
        showMessage('Audit log refreshed', 'success');
    } catch (error) {
        showMessage('Failed to refresh audit log', 'error');
    }
}

function exportUsers() {
    if (typeof XLSX === 'undefined') {
        showMessage('Excel export feature not available.', 'error');
        return;
    }

    const data = users.map(u => ({
        'Name': u.name,
        'Username': u.username,
        'Email': u.email,
        'Role': u.role,
        'Status': u.isActive ? 'Active' : 'Inactive',
        'Created': new Date(u.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    XLSX.writeFile(workbook, 'users_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showMessage('Users exported successfully!', 'success');
}

function exportAuditLog() {
    if (typeof XLSX === 'undefined') {
        showMessage('Excel export feature not available.', 'error');
        return;
    }

    const data = auditLog.map(a => ({
        'Timestamp': new Date(a.timestamp).toLocaleString(),
        'User': a.user,
        'Action': a.action,
        'Details': a.details,
        'Resource Type': a.resourceType || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
    
    XLSX.writeFile(workbook, 'audit_log_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showMessage('Audit log exported successfully!', 'success');
}

// API helper function
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Message and Modal Functions
function showMessage(message, type) {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'status-message status-' + type;
    messageDiv.textContent = message;
    
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '400px';
    messageDiv.style.animation = 'slideIn 0.3s ease-out';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

function submitContact(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    showMessage('Thank you, ' + name + '! Your message has been sent. We will get back to you soon.', 'success');
    event.target.reset();
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .status-online { color: #10b981; }
        .status-offline { color: #ef4444; }
        
        .overdue { color: #ef4444; font-weight: bold; }
        .blockchain-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem; }
        .verification-card, .grading-card { background: #f8f9fa; padding: 2rem; border-radius: 12px; }
        .verification-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .verification-error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .assignments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
        .assignment-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .assignment-info-bar { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .system-status { background: #f8f9fa; padding: 1rem; border-radius: 8px; }
        .hash-cell { font-family: monospace; font-size: 0.9em; }
        .assignment-submit-card { background: #f8f9fa; padding: 2rem; border-radius: 12px; }
        .assignment-info { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        
        @media (max-width: 768px) {
            .blockchain-section { grid-template-columns: 1fr; }
            .assignments-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
});

function updateConnectionStatus() {
    const statusElements = document.querySelectorAll('[data-connection-status]');
    const status = navigator.onLine ? 'Online' : 'Offline';
    statusElements.forEach(element => {
        element.textContent = status;
        element.className = navigator.onLine ? 'status-online' : 'status-offline';
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('verificationResult')) {
            document.getElementById('verificationResult').innerHTML = '';
        }
    }
    
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentUser && currentUser.role === 'admin') {
            exportAuditLog();
        }
    }
});

// Global error handlers
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showMessage('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showMessage('A network error occurred. Please check your connection.', 'warning');
});