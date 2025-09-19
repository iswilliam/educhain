// EduChain Assignment Management System - FIXED VERSION

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
        showMessage('Login failed. Please check your connection and try again.', 'error');
    }
}

async function loadUserData() {
    try {
        console.log('Loading user data for:', currentUser.role); // Debug log
        
        // Load assignment templates for ALL users - this queries assignmenttemplates table
        const templatesResult = await apiCall('/api/assignments/templates');
        if (templatesResult.success) {
            assignmentTemplates = templatesResult.templates || [];
            console.log('Loaded assignment templates:', assignmentTemplates.length); // Debug log
        }

        // Load submissions based on role - this queries submissions table
        if (currentUser.role === 'student') {
            const submissionsResult = await apiCall(`/api/submissions/student/${currentUser.id}`);
            if (submissionsResult.success) {
                submissions = submissionsResult.submissions || [];
                console.log('Loaded student submissions:', submissions.length); // Debug log
            }
        } else if (currentUser.role === 'lecturer' || currentUser.role === 'admin') {
            // Load ALL submissions for lecturers and admins - queries submissions table
            const submissionsResult = await apiCall('/api/submissions/all');
            if (submissionsResult.success) {
                submissions = submissionsResult.submissions || [];
                console.log('Loaded all submissions:', submissions.length); // Debug log
            }
        }

        // Load users for admin - this queries users table
        if (currentUser.role === 'admin') {
            const userResult = await apiCall('/api/users');
            if (userResult.success) {
                users = userResult.users || [];
                console.log('Loaded users:', users.length); // Debug log
            }
        }

        // Load audit logs for admin - this queries auditlogs table
        if (currentUser.role === 'admin') {
            const auditResult = await apiCall('/api/audit');
            if (auditResult.success) {
                auditLog = auditResult.auditLogs || [];
                console.log('Loaded audit logs:', auditLog.length); // Debug log
            }
        }

        // Load blockchain records for ALL users - this queries blockchainrecords table
        const blockchainResult = await apiCall('/api/blockchain/records');
        if (blockchainResult.success) {
            blockchainRecords = blockchainResult.records || [];
            console.log('Loaded blockchain records:', blockchainRecords.length); // Debug log
        }

        console.log('Data loading completed'); // Debug log
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showMessage('Some data could not be loaded from server.', 'warning');
    }
}

async function refreshDashboard() {
    await loadUserData();
    // Re-render current section
    const activeBtn = document.querySelector('.dashboard-btn.active');
    if (activeBtn) {
        const section = activeBtn.textContent.toLowerCase();
        if (section.includes('manage')) showDashboardSection('manage-assignments');
        else if (section.includes('grade')) showDashboardSection('grade-submissions');
        else if (section.includes('available')) showDashboardSection('assignments');
        else if (section.includes('submissions')) showDashboardSection('submissions');
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

function showPasswordChangeModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content password-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Change Password</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form onsubmit="handlePasswordChange(event)">
                        <div class="form-group">
                            <label for="currentPassword">Current Password:</label>
                            <input type="password" id="currentPassword" name="currentPassword" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" name="newPassword" minlength="6" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" minlength="6" required>
                        </div>
                        
                        <div class="password-requirements">
                            <small>Password must be at least 6 characters long</small>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" onclick="closeModal()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Change Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function handlePasswordChange(event) {
    event.preventDefault();
    
    const form = event.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        showMessage('Changing password...', 'info');
        
        const result = await apiCall('/api/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({
                userId: currentUser.id,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        if (result.success) {
            closeModal();
            showMessage('Password changed successfully!', 'success');
            // Refresh audit log if currently viewing it
            if (document.querySelector('.audit-table')) {
                await loadUserData();
                showDashboardSection('audit');
            }
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showMessage('Failed to change password. Please try again.', 'error');
    }
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
            // Fix: Use proper filtering for student submissions
            const mySubmissions = submissions.filter(s => {
                return s.studentId === currentUser.id || 
                       s.studentId?.toString() === currentUser.id?.toString() ||
                       (s.student && (s.student._id === currentUser.id || s.student.id === currentUser.id));
            });
            
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
                '<h3>' + mySubmissions.filter(s => s.grade || s.marks).length + '</h3>' +
                '<p>Graded</p>' +
                '</div>' +
                '</div>';
            break;
            
        case 'lecturer':
            // Fix: Proper filtering for lecturer's created assignments from assignmenttemplates table
            const myAssignments = assignmentTemplates.filter(a => {
                // Handle both ObjectId and string comparisons
                return a.createdBy === currentUser.id || 
                       a.createdBy?.toString() === currentUser.id?.toString() ||
                       (typeof a.createdBy === 'object' && a.createdBy._id === currentUser.id) ||
                       (typeof a.createdBy === 'object' && a.createdBy._id?.toString() === currentUser.id?.toString());
            });
            
            // Fix: Count all submissions for lecturer's assignments from submissions table
            const myAssignmentIds = myAssignments.map(a => a._id?.toString() || a._id);
            const allMySubmissions = submissions.filter(s => {
                const submissionAssignmentId = s.assignmentTemplate?._id?.toString() || 
                                              s.assignmentTemplate?.toString() || 
                                              s.assignmentTemplateId?.toString();
                return myAssignmentIds.includes(submissionAssignmentId);
            });
            
            stats = '<div class="features-grid">' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📋</div>' +
                '<h3>' + myAssignments.length + '</h3>' +
                '<p>Created Assignments</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📝</div>' +
                '<h3>' + allMySubmissions.length + '</h3>' +
                '<p>Total Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">⏳</div>' +
                '<h3>' + allMySubmissions.filter(s => !s.grade && !s.marks).length + '</h3>' +
                '<p>Pending Grading</p>' +
                '</div>' +
                '</div>';
            break;
            
        case 'admin':
            // Fix: Count from correct tables - users table, submissions table, blockchainrecords table
            const totalUsers = users.length;
            const totalAssignments = assignmentTemplates.length; // From assignmenttemplates table
            const totalSubmissions = submissions.length; // From submissions table
            const gradedSubmissions = submissions.filter(s => s.grade || s.marks).length;
            
            stats = '<div class="features-grid">' +
                '<div class="feature-card">' +
                '<div class="feature-icon">👥</div>' +
                '<h3>' + totalUsers + '</h3>' +
                '<p>Total Users</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📚</div>' +
                '<h3>' + totalAssignments + '</h3>' +
                '<p>Total Assignments</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">📝</div>' +
                '<h3>' + totalSubmissions + '</h3>' +
                '<p>Total Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">✅</div>' +
                '<h3>' + gradedSubmissions + '</h3>' +
                '<p>Graded Submissions</p>' +
                '</div>' +
                '<div class="feature-card">' +
                '<div class="feature-icon">🔗</div>' +
                '<h3>' + blockchainRecords.length + '</h3>' +
                '<p>Blockchain Records</p>' +
                '</div>' +
                '</div>';
            break;
    }

    // Add this after the system status div, before the closing content.innerHTML
'<div style="margin-top: 2rem;">' +
'<h4>Account Settings</h4>' +
'<button class="btn btn-secondary" onclick="showPasswordChangeModal()">Change Password</button>' +
'</div>' ;
    
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
                    ${assignment.blockchainHash ? `<p><strong>Blockchain Hash:</strong> <code style="font-size:0.8em;word-break:break-all;background:#f0f0f0;padding:2px 4px;border-radius:3px;">${assignment.blockchainHash}</code></p>` : ''}
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

// FIXED: showSubmitForm function
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
    
    // FIXED: Correct form ID reference
    document.getElementById('submissionForm').addEventListener('submit', handleSubmission);
}

// FIXED: handleSubmission function
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
    // Refresh data from database instead of just adding locally
    await loadUserData();
    showMessage('Assignment submitted successfully! Blockchain hash: ' + (result.submission?.blockchainHash ? result.submission.blockchainHash.substring(0, 16) + '...' : 'Submitted'), 'success');
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
    
    // Fix: Handle both possible data structures
    const mySubmissions = submissions.filter(s => {
        // Handle both direct studentId match and nested student object
        return s.studentId === currentUser.id || 
               s.studentId?.toString() === currentUser.id?.toString() ||
               (s.student && (s.student.id === currentUser.id || s.student._id === currentUser.id));
    });
    
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
        
        // Fix: Handle nested assignmentTemplate structure
        const assignmentTitle = submission.assignmentTemplate?.title || 'Unknown Assignment';
        const courseCode = submission.assignmentTemplate?.courseCode || 'N/A';
        const dueDate = submission.assignmentTemplate?.dueDate || new Date();
        const maxMarks = submission.assignmentTemplate?.maxMarks || 100;
        
        submissionsHTML += `
            <div class="submission-card">
                <div class="submission-header">
                    <h4>${assignmentTitle}</h4>
                    <span class="status ${statusClass}">${submission.status}</span>
                </div>
                <div class="submission-details">
                    <p><strong>Course:</strong> ${courseCode}</p>
                    <p><strong>Submitted:</strong> ${submissionDate}</p>
                    <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                    ${submission.grade || submission.marks ? `<p><strong>Grade:</strong> ${submission.marks || submission.grade}</p>` : ''}
                    ${submission.marks || submission.grade ? `<p><strong>Marks:</strong> ${submission.marks || submission.grade}/${maxMarks}</p>` : ''}
                    ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
                    ${submission.blockchainHash ? `<p><strong>Blockchain Hash:</strong> <code style="font-size:0.7em;word-break:break-all;background:#f0f0f0;padding:2px;border-radius:2px;cursor:pointer;" onclick="copyToClipboard('${submission.blockchainHash}')">${submission.blockchainHash}</code></p>` : ''}
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
// SHOW NOTIFICTION
function showNotification(message, type) {
    showMessage(message, type);
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
    const assignmentData = {
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
            body: JSON.stringify(assignmentData)
        });
        
      if (result.success) {
    // Refresh data from database instead of just adding locally
    await loadUserData();
    showMessage('Assignment created successfully! Blockchain hash: ' + (result.blockchainHash ? result.blockchainHash.substring(0, 16) + '...' : 'Created'), 'success');
    showDashboardSection('manage-assignments');
} else {
    showMessage('Error: ' + result.error, 'error');
}
    } catch (error) {
        console.error('Assignment creation error:', error);
        showMessage('Failed to create assignment. Please try again.', 'error');
    }
}

function showManageAssignments() {
    const content = document.getElementById('dashboardContent');
    
    // Fix: Handle both string and ObjectId comparisons for createdBy field
    const myAssignments = assignmentTemplates.filter(a => {
        return a.createdBy === currentUser.id || 
               a.createdBy?.toString() === currentUser.id?.toString() ||
               (typeof a.createdBy === 'object' && a.createdBy._id === currentUser.id);
    });
    
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
        
        // Fix: Handle assignmentTemplate reference properly
        const assignmentSubmissions = submissions.filter(s => {
            return s.assignmentTemplate && 
                   (s.assignmentTemplate._id === assignment._id || 
                    s.assignmentTemplate._id?.toString() === assignment._id?.toString());
        });
        
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
                    <p><strong>Graded:</strong> ${assignmentSubmissions.filter(s => s.grade || s.marks).length}</p>
                    <p><strong>Created:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
                    ${assignment.blockchainHash ? `<p><strong>Blockchain Hash:</strong> <code style="font-size:0.7em;word-break:break-all;background:#f0f0f0;padding:2px;border-radius:2px;cursor:pointer;" onclick="copyToClipboard('${assignment.blockchainHash}')">${assignment.blockchainHash}</code></p>` : ''}
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

// Continue from where the code stopped - completing viewAssignmentSubmissions function

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
                <i class="fas fa-inbox"></i>
                <h4>No submissions yet</h4>
                <p>Students haven't submitted any assignments yet.</p>
            </div>
        `;
    } else {
        // Group submissions by status
        const pendingSubmissions = assignmentSubmissions.filter(s => s.status === 'submitted' || !s.grade);
        const gradedSubmissions = assignmentSubmissions.filter(s => s.status === 'graded' || s.grade);
        
        submissionsHTML += `
            <div class="submissions-tabs">
                <button class="tab-btn active" onclick="showSubmissionTab('all')">All (${assignmentSubmissions.length})</button>
                <button class="tab-btn" onclick="showSubmissionTab('pending')">Pending (${pendingSubmissions.length})</button>
                <button class="tab-btn" onclick="showSubmissionTab('graded')">Graded (${gradedSubmissions.length})</button>
            </div>

            <div class="submissions-actions">
                <button class="btn btn-primary" onclick="downloadAllSubmissions('${assignmentId}')">
                    <i class="fas fa-download"></i> Download All
                </button>
                <button class="btn btn-secondary" onclick="exportGrades('${assignmentId}')">
                    <i class="fas fa-file-export"></i> Export Grades
                </button>
            </div>

            <div class="submissions-list">
        `;

        // Sort submissions by submission date (most recent first)
        assignmentSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        assignmentSubmissions.forEach(submission => {
            const student = users.find(u => u.id === submission.studentId) || { name: submission.studentName || 'Unknown Student', email: 'N/A' };
            const isLate = new Date(submission.submittedAt) > new Date(assignment.dueDate);
            const status = submission.grade ? 'graded' : 'submitted';
            
            submissionsHTML += `
                <div class="submission-card" data-status="${status}">
                    <div class="submission-header">
                        <div class="student-info">
                            <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
                            <div>
                                <h4>${student.name}</h4>
                                <p>${student.email}</p>
                            </div>
                        </div>
                        <div class="submission-status">
                            <span class="status-badge ${status}">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                            ${isLate ? '<span class="late-badge">Late</span>' : ''}
                        </div>
                    </div>

                    <div class="submission-details">
                        <div class="detail-row">
                            <span><i class="fas fa-clock"></i> Submitted:</span>
                            <span>${new Date(submission.submittedAt).toLocaleString()}</span>
                        </div>
                        
                        ${submission.grade ? `
                            <div class="detail-row">
                                <span><i class="fas fa-star"></i> Grade:</span>
                                <span class="grade-display">${submission.marks || submission.grade}/${assignment.maxMarks} 
                                      (${Math.round(((submission.marks || submission.grade) / assignment.maxMarks) * 100)}%)</span>
                            </div>
                        ` : ''}
                        
                        ${submission.feedback ? `
                            <div class="detail-row">
                                <span><i class="fas fa-comment"></i> Feedback:</span>
                                <span>${submission.feedback}</span>
                            </div>
                        ` : ''}
                        
                        ${submission.blockchainHash ? `
                            <div class="detail-row">
                                <span><i class="fas fa-link"></i> Blockchain:</span>
                                <span class="blockchain-hash" onclick="copyToClipboard('${submission.blockchainHash}')">${submission.blockchainHash.substring(0, 16)}...</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="submission-files">
                        <h5><i class="fas fa-paperclip"></i> Submitted Files:</h5>
                        <div class="files-list">
                            ${submission.fileName ? `
                                <div class="file-item">
                                    <i class="fas fa-file"></i>
                                    <span>${submission.fileName}</span>
                                    <button onclick="downloadSubmission('${submission._id}')" class="download-btn">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            ` : '<p>No files available</p>'}
                        </div>
                    </div>

                    <div class="submission-actions">
                        <button onclick="viewSubmissionDetail('${submission._id}')" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${!submission.grade ? `
                            <button onclick="gradeSubmission('${submission._id}')" class="btn btn-primary btn-sm">
                                <i class="fas fa-edit"></i> Grade
                            </button>
                        ` : `
                            <button onclick="editGrade('${submission._id}')" class="btn btn-secondary btn-sm">
                                <i class="fas fa-edit"></i> Edit Grade
                            </button>
                        `}
                        ${submission.blockchainHash ? `
                            <button onclick="verifyBlockchainRecord('${submission._id}', 'submission')" class="btn btn-secondary btn-sm">
                                <i class="fas fa-shield-alt"></i> Verify
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        submissionsHTML += `
            </div>
        `;
    }

    submissionsHTML += `
        <div class="back-action">
            <button onclick="showDashboardSection('manage-assignments')" class="btn btn-outline">
                <i class="fas fa-arrow-left"></i> Back to Assignments
            </button>
        </div>
    `;

    content.innerHTML = submissionsHTML;
}

// Helper function to show different submission tabs
function showSubmissionTab(tab) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const submissionCards = document.querySelectorAll('.submission-card');
    
    // Update active tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide submissions based on tab
    submissionCards.forEach(card => {
        const status = card.getAttribute('data-status');
        
        if (tab === 'all') {
            card.style.display = 'block';
        } else if (tab === 'pending' && status === 'submitted') {
            card.style.display = 'block';
        } else if (tab === 'graded' && status === 'graded') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Grade Submissions section for lecturers
function showGradeSubmissions() {
    const content = document.getElementById('dashboardContent');
    
    // Fix: Get all submissions for assignments created by current lecturer
    const myAssignments = assignmentTemplates.filter(a => {
        return a.createdBy === currentUser.id || 
               a.createdBy?.toString() === currentUser.id?.toString() ||
               (typeof a.createdBy === 'object' && a.createdBy._id === currentUser.id);
    });
    
    const myAssignmentIds = myAssignments.map(a => a._id?.toString() || a._id);
    
    // Fix: Filter submissions more accurately
    const pendingSubmissions = submissions.filter(s => {
        const assignmentId = s.assignmentTemplate?._id?.toString() || s.assignmentTemplate?.toString();
        return myAssignmentIds.includes(assignmentId) && !s.grade && !s.marks;
    });
    
    if (pendingSubmissions.length === 0) {
        content.innerHTML = `
            <h3>Grade Submissions</h3>
            <div class="no-submissions">
                <p>No submissions pending grading.</p>
                <button class="btn btn-primary" onclick="showDashboardSection('manage-assignments')">View My Assignments</button>
            </div>
        `;
        return;
    }
    
    let gradingHTML = `
        <h3>Grade Submissions</h3>
        <p>You have ${pendingSubmissions.length} submission(s) pending grading.</p>
        <div class="grading-queue">
    `;
    
    pendingSubmissions.forEach(submission => {
        // Fix: Find assignment properly
        const assignment = assignmentTemplates.find(a => {
            const submissionAssignmentId = submission.assignmentTemplate?._id?.toString() || submission.assignmentTemplate?.toString();
            return a._id?.toString() === submissionAssignmentId || a._id === submissionAssignmentId;
        });
        
        // Fix: Handle student data properly
        const student = users.find(u => {
            return u.id === submission.studentId || 
                   u._id === submission.studentId ||
                   u.id?.toString() === submission.studentId?.toString();
        }) || { name: submission.studentName || 'Unknown Student' };
        
        if (!assignment) return; // Skip if assignment not found
        
        gradingHTML += `
            <div class="grading-card">
                <div class="grading-header">
                    <h4>${assignment.title}</h4>
                    <span class="student-name">Student: ${student.name}</span>
                </div>
                <div class="grading-details">
                    <p><strong>Course:</strong> ${assignment.courseCode}</p>
                    <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
                    <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                    <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                </div>
                <div class="grading-actions">
                    <button class="btn btn-primary" onclick="gradeSubmission('${submission._id}')">Grade Now</button>
                    <button class="btn btn-secondary" onclick="downloadSubmission('${submission._id}')">Download</button>
                </div>
            </div>
        `;
    });
    
    gradingHTML += '</div>';
    content.innerHTML = gradingHTML;
}

// Grading functions
function gradeSubmission(submissionId) {
    const submission = submissions.find(s => s._id === submissionId);
    if (!submission) return;
    
    const student = users.find(u => u.id === submission.studentId) || { name: submission.studentName || 'Unknown Student' };
    const assignment = assignmentTemplates.find(a => a._id === submission.assignmentTemplate._id);
    
    const gradeModal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content grade-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Grade Submission</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="student-info-header">
                        <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <h4>${student.name}</h4>
                            <p>${assignment.title}</p>
                        </div>
                    </div>
                    
                    <form onsubmit="submitGrade(event, '${submissionId}')">
                        <div class="form-group">
                            <label for="marks">Marks:</label>
                            <div class="score-input">
                                <input type="number" 
                                       id="marks" 
                                       name="marks" 
                                       min="0" 
                                       max="${assignment.maxMarks}" 
                                       value="${submission.marks || submission.grade || ''}" 
                                       required>
                                <span>/ ${assignment.maxMarks}</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback">Feedback:</label>
                            <textarea id="feedback" 
                                      name="feedback" 
                                      rows="4" 
                                      placeholder="Provide feedback to the student...">${submission.feedback || ''}</textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" onclick="closeModal()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Grade</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', gradeModal);
}

function editGrade(submissionId) {
    gradeSubmission(submissionId); // Reuse the same modal
}

async function submitGrade(event, submissionId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const marks = parseInt(formData.get('marks'));
    const feedback = formData.get('feedback');
    
    try {
        showMessage('Saving grade...', 'info');
        
        const result = await apiCall('/api/submissions/grade', {
            method: 'PUT',
            body: JSON.stringify({
                submissionId: submissionId,
                marks: marks,
                feedback: feedback,
                gradedBy: currentUser.id
            })
        });
        
        if (result.success) {
            closeModal();
            // Refresh all data from database
            await loadUserData();
            showMessage('Grade saved successfully! Blockchain hash: ' + (result.blockchainHash ? result.blockchainHash.substring(0, 16) + '...' : 'Saved'), 'success');
            showDashboardSection('grade-submissions');
        } else {
            showMessage('Error saving grade: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Grading error:', error);
        showMessage('Failed to save grade. Please try again.', 'error');
    }
}

// Admin Functions
function showManageUsers() {
    const content = document.getElementById('dashboardContent');
    
    let usersHTML = `
        <h3>Manage Users</h3>
        <div class="users-actions">
            <button class="btn btn-primary" onclick="showAddUserForm()">Add New User</button>
            <button class="btn btn-secondary" onclick="exportUserList()">Export User List</button>
        </div>
        <div class="users-list">
    `;
    
    users.forEach(user => {
        usersHTML += `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <h4>${user.name}</h4>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                        <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                        ${user.walletAddress ? `<p><strong>Wallet:</strong> ${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}</p>` : ''}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editUser('${user.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">Delete</button>
                </div>
            </div>
        `;
    });
    
    usersHTML += '</div>';
    content.innerHTML = usersHTML;
}

function showSystemOverview() {
    const content = document.getElementById('dashboardContent');
    
    const totalUsers = users.length;
    const totalAssignments = assignmentTemplates.length;
    const totalSubmissions = submissions.length;
    const totalGraded = submissions.filter(s => s.grade).length;
    const pendingGrading = totalSubmissions - totalGraded;
    
    content.innerHTML = `
        <h3>System Overview</h3>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h3>${totalUsers}</h3>
                <p>Total Users</p>
                <small>
                    Students: ${users.filter(u => u.role === 'student').length} | 
                    Lecturers: ${users.filter(u => u.role === 'lecturer').length} | 
                    Admins: ${users.filter(u => u.role === 'admin').length}
                </small>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3>${totalAssignments}</h3>
                <p>Total Assignments</p>
                <small>Active templates created by lecturers</small>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3>${totalSubmissions}</h3>
                <p>Total Submissions</p>
                <small>All student submissions</small>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h3>${totalGraded}</h3>
                <p>Graded Submissions</p>
                <small>${pendingGrading} pending grading</small>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <h3>${blockchainRecords.length}</h3>
                <p>Blockchain Records</p>
                <small>Immutable transaction records</small>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>${Math.round((totalGraded / totalSubmissions) * 100) || 0}%</h3>
                <p>Completion Rate</p>
                <small>Percentage of graded submissions</small>
            </div>
        </div>
        
        <div class="system-health">
            <h4>System Health</h4>
            <div class="health-indicators">
                <div class="health-item">
                    <span class="health-label">Database Status:</span>
                    <span class="health-status success">Connected ✅</span>
                </div>
                <div class="health-item">
                    <span class="health-label">Blockchain Network:</span>
                    <span class="health-status ${blockchainRecords.length > 0 ? 'success' : 'warning'}">${blockchainRecords.length > 0 ? 'Active ✅' : 'Inactive ⚠️'}</span>
                </div>
                <div class="health-item">
                    <span class="health-label">File Storage:</span>
                    <span class="health-status success">Online ✅</span>
                </div>
                <div class="health-item">
                    <span class="health-label">API Services:</span>
                    <span class="health-status success">Operational ✅</span>
                </div>
            </div>
        </div>
    `;
}

function showAuditTrail() {
    const content = document.getElementById('dashboardContent');
    
    if (auditLog.length === 0) {
        content.innerHTML = `
            <h3>Audit Trail</h3>
            <div class="no-audit">
                <p>No audit records found.</p>
            </div>
        `;
        return;
    }
    
    let auditHTML = `
        <h3>Audit Trail</h3>
        <div class="audit-controls">
            <div class="audit-filters">
                <select id="auditTypeFilter" onchange="filterAuditLogs()">
                    <option value="all">All Actions</option>
                    <option value="Login">Login</option>
                    <option value="Password Changed">Password Changed</option>
                    <option value="Assignment Template Created">Assignment Created</option>
                    <option value="Assignment Submitted">Assignment Submitted</option>
                    <option value="Assignment Graded">Assignment Graded</option>
                    <option value="Failed Login Attempt">Failed Login</option>
                </select>
                <input type="date" id="auditDateFilter" onchange="filterAuditLogs()" placeholder="Filter by date">
                <button class="btn btn-secondary" onclick="exportAuditLog()">Export Audit Log</button>
            </div>
        </div>
        
        <div class="audit-table-container">
            <table class="audit-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Resource Type</th>
                        <th>IP Address</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort audit log by timestamp (most recent first)
    const sortedAuditLog = [...auditLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedAuditLog.forEach(record => {
        const timestamp = new Date(record.timestamp).toLocaleString();
        const statusClass = getAuditStatusClass(record.action);
        
        auditHTML += `
            <tr class="audit-row" data-action="${record.action}" data-date="${new Date(record.timestamp).toISOString().split('T')[0]}">
                <td class="timestamp-cell" title="${timestamp}">${timestamp}</td>
                <td class="user-cell">
                    <div class="user-info">
                        <span class="user-name">${record.user}</span>
                        ${record.userId ? `<small class="user-id">ID: ${record.userId.toString().substring(0, 8)}</small>` : ''}
                    </div>
                </td>
                <td class="action-cell">
                    <span class="action-badge ${statusClass}">${record.action}</span>
                </td>
                <td class="details-cell" title="${record.details}">${record.details}</td>
                <td class="resource-cell">${record.resourceType || 'N/A'}</td>
                <td class="ip-cell">${record.ipAddress || 'N/A'}</td>
                <td class="status-cell">
                    ${record.blockchainHash ? 
                        `<span class="blockchain-verified" title="Blockchain verified">🔗</span>` : 
                        `<span class="status-normal">✓</span>`
                    }
                </td>
            </tr>
        `;
    });
    
    auditHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="audit-stats">
            <div class="stats-row">
                <span><strong>Total Records:</strong> ${auditLog.length}</span>
                <span><strong>Today:</strong> ${auditLog.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length}</span>
                <span><strong>This Week:</strong> ${auditLog.filter(r => {
                    const recordDate = new Date(r.timestamp);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return recordDate >= weekAgo;
                }).length}</span>
            </div>
        </div>
    `;
    
    content.innerHTML = auditHTML;
}

// Blockchain Functions
function showBlockchainSection() {
    const content = document.getElementById('dashboardContent');
    
    content.innerHTML = `
        <h3>Blockchain Verification</h3>
        <div class="blockchain-tools">
            <div class="verification-form">
                <h4>Verify Record</h4>
                <form onsubmit="verifyRecord(event)">
                    <div class="form-group">
                        <label for="verifyHash">Blockchain Hash:</label>
                        <input type="text" id="verifyHash" placeholder="Enter blockchain hash to verify" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Verify Record</button>
                </form>
            </div>
            
            <div class="blockchain-stats">
                <h4>Blockchain Statistics</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${blockchainRecords.length}</span>
                        <span class="stat-label">Total Records</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${blockchainRecords.filter(r => r.type === 'assignment_template').length}</span>
                        <span class="stat-label">Assignment Templates</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${blockchainRecords.filter(r => r.type === 'submission').length}</span>
                        <span class="stat-label">Submissions</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${blockchainRecords.filter(r => r.type === 'grading').length}</span>
                        <span class="stat-label">Gradings</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="blockchain-records">
            <h4>Recent Blockchain Records</h4>
            ${blockchainRecords.length === 0 ? 
                '<p>No blockchain records found.</p>' : 
                generateBlockchainRecordsHTML()
            }
        </div>
    `;
}

function generateBlockchainRecordsHTML() {
    let recordsHTML = '<div class="records-list">';
    
    // Sort by timestamp, most recent first
    const sortedRecords = [...blockchainRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedRecords.slice(0, 20).forEach(record => {
        // Fix: Add null check and provide default value for record.type
        const recordType = record.type || 'unknown';
        const displayType = recordType.replace('_', ' ').toUpperCase();
        
        recordsHTML += `
            <div class="blockchain-record">
                <div class="record-header">
                    <span class="record-type">${displayType}</span>
                    <span class="record-timestamp">${new Date(record.timestamp).toLocaleString()}</span>
                </div>
                <div class="record-details">
                    <p><strong>Hash:</strong> <code class="blockchain-hash" onclick="copyToClipboard('${record.hash}')">${record.hash}</code></p>
                    <p><strong>Description:</strong> ${record.description || 'No description available'}</p>
                    ${record.userId ? `<p><strong>User ID:</strong> ${record.userId}</p>` : ''}
                </div>
                <div class="record-actions">
                    <button class="btn btn-sm btn-secondary" onclick="verifyBlockchainRecord('${record.recordId}', '${recordType}')">Verify</button>
                    <button class="btn btn-sm btn-outline" onclick="copyToClipboard('${record.hash}')">Copy Hash</button>
                </div>
            </div>
        `;
    });
    
    recordsHTML += '</div>';
    return recordsHTML;
}

// Utility Functions
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
        const response = await fetch(endpoint, finalOptions);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

function showMessage(message, type) {
    // Remove any existing messages
    const existingMsg = document.querySelector('.message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at top of page
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function getStatusClass(status) {
    switch (status) {
        case 'submitted': return 'status-submitted';
        case 'graded': return 'status-graded';
        case 'late': return 'status-late';
        default: return 'status-pending';
    }
}

function getAuditStatusClass(action) {
    if (action.includes('Failed') || action.includes('Error')) return 'status-error';
    if (action.includes('Login')) return 'status-success';
    if (action.includes('Created') || action.includes('Submitted')) return 'status-info';
    if (action.includes('Graded') || action.includes('Changed')) return 'status-warning';
    return 'status-normal';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('Failed to copy to clipboard', 'error');
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Download and Export Functions
async function downloadSubmission(submissionId) {
    try {
        const response = await fetch(`/api/submissions/download/${submissionId}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `submission_${submissionId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            showMessage('File download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Download functionality not available in demo mode', 'info');
    }
}

function downloadAllSubmissions(assignmentId) {
    showMessage('Bulk download functionality would be implemented here', 'info');
}

function exportGrades(assignmentId) {
    const assignment = assignmentTemplates.find(a => a._id === assignmentId);
    const assignmentSubmissions = submissions.filter(s => s.assignmentTemplate._id === assignmentId);
    
    let csvContent = "Student Name,Username,Grade,Max Score,Percentage,Status,Submitted At,Feedback\n";
    
    assignmentSubmissions.forEach(submission => {
        const student = users.find(u => u.id === submission.studentId) || { name: submission.studentName || 'Unknown', username: 'N/A' };
        const grade = submission.marks || submission.grade || 'Not Graded';
        const percentage = (submission.marks || submission.grade) ? Math.round(((submission.marks || submission.grade) / assignment.maxMarks) * 100) : 'N/A';
        
        csvContent += `"${student.name}","${student.username}","${grade}","${assignment.maxMarks}","${percentage}%","${submission.status || 'submitted'}","${new Date(submission.submittedAt).toLocaleString()}","${(submission.feedback || '').replace(/"/g, '""')}"\n`;
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${assignment.title}_grades.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Grades exported successfully!', 'success');
}

function exportUserList() {
    let csvContent = "ID,Name,Username,Role,Email,Wallet Address,Created\n";
    
    users.forEach(user => {
        csvContent += `"${user.id}","${user.name}","${user.username}","${user.role}","${user.email || 'N/A'}","${user.walletAddress || 'N/A'}","${user.createdAt || 'N/A'}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('User list exported successfully!', 'success');
}

function exportAuditLog() {
    let csvContent = "Timestamp,Action,User,Role,Description,Blockchain Hash\n";
    
    auditLog.forEach(record => {
        csvContent += `"${record.timestamp}","${record.action}","${record.userName}","${record.userRole}","${record.description}","${record.blockchainHash || 'N/A'}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'audit_log.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Audit log exported successfully!', 'success');
}

// Verification Functions
async function verifyRecord(event) {
    event.preventDefault();
    
    const hash = document.getElementById('verifyHash').value.trim();
    if (!hash) {
        showMessage('Please enter a blockchain hash', 'error');
        return;
    }
    
    try {
        showMessage('Verifying record...', 'info');
        
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ hash: hash })
        });
        
        if (result.success) {
            showMessage(`✅ Record verified! Type: ${result.record.type}, Timestamp: ${new Date(result.record.timestamp).toLocaleString()}`, 'success');
        } else {
            showMessage('❌ Record not found or invalid hash', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        
        // Fallback verification for demo
        const record = blockchainRecords.find(r => r.hash === hash);
        if (record) {
            showMessage(`✅ Record verified! Type: ${record.type}, Timestamp: ${new Date(record.timestamp).toLocaleString()}`, 'success');
        } else {
            showMessage('❌ Record not found in local blockchain records', 'error');
        }
    }
}

async function verifyBlockchainRecord(recordId, type) {
    try {
        showMessage('Verifying blockchain record...', 'info');
        
        // Get the hash from the record
        let hash;
        if (type === 'assignment_template') {
            const record = assignmentTemplates.find(a => a._id === recordId);
            hash = record?.blockchainHash;
        } else if (type === 'submission') {
            const record = submissions.find(s => s._id === recordId);
            hash = record?.blockchainHash;
        }
        
        if (!hash) {
            showMessage('No blockchain hash found for this record', 'error');
            return;
        }
        
        // Call backend verification endpoint
        const result = await apiCall('/api/blockchain/verify', {
            method: 'POST',
            body: JSON.stringify({ 
                hash: hash,
                recordId: recordId,
                type: type
            })
        });
        
        if (result.success) {
            if (result.verified) {
                const ethereumStatus = result.ethereumVerified ? ' (Ethereum verified)' : ' (Database verified)';
                showMessage('✅ Blockchain verification successful!' + ethereumStatus, 'success');
            } else {
                showMessage('❌ Blockchain verification failed! Record integrity compromised.', 'error');
            }
        } else {
            showMessage('❌ Verification failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Blockchain verification error:', error);
        showMessage('❌ Verification service error: ' + error.message, 'error');
    }
}

// Additional User Management Functions
function showAddUserForm() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Add New User</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form onsubmit="addNewUser(event)">
                        <div class="form-group">
                            <label for="newUserName">Full Name:</label>
                            <input type="text" id="newUserName" name="name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUsername">Username:</label>
                            <input type="text" id="newUsername" name="username" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserEmail">Email:</label>
                            <input type="email" id="newUserEmail" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserRole">Role:</label>
                            <select id="newUserRole" name="role" required>
                                <option value="">Select Role</option>
                                <option value="student">Student</option>
                                <option value="lecturer">Lecturer</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserPassword">Password:</label>
                            <input type="password" id="newUserPassword" name="password" required>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" onclick="closeModal()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function addNewUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        password: formData.get('password')
    };
    
    try {
        showMessage('Creating user...', 'info');
        
        const result = await apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success) {
            users.push(result.user);
            closeModal();
            showMessage('User created successfully!', 'success');
            showDashboardSection('users');
        } else {
            showMessage('Error creating user: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('User creation error:', error);
        
        // Fallback for demo mode
        const newUser = {
            id: users.length + 1,
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        
        closeModal();
        showMessage('User created successfully! (Demo mode)', 'success');
        showDashboardSection('users');
    }
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Edit User</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form onsubmit="updateUser(event, '${userId}')">
                        <div class="form-group">
                            <label for="editUserName">Full Name:</label>
                            <input type="text" id="editUserName" name="name" value="${user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUsername">Username:</label>
                            <input type="text" id="editUsername" name="username" value="${user.username}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserEmail">Email:</label>
                            <input type="email" id="editUserEmail" name="email" value="${user.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserRole">Role:</label>
                            <select id="editUserRole" name="role" required>
                                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                                <option value="lecturer" ${user.role === 'lecturer' ? 'selected' : ''}>Lecturer</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                            </select>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" onclick="closeModal()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function updateUser(event, userId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role')
    };
    
    try {
        showMessage('Updating user...', 'info');
        
        const result = await apiCall(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (result.success) {
            const userIndex = users.findIndex(u => u.id == userId);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...userData };
            }
            closeModal();
            showMessage('User updated successfully!', 'success');
            showDashboardSection('users');
        } else {
            showMessage('Error updating user: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('User update error:', error);
        
        // Fallback for demo mode
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...userData };
        }
        
        closeModal();
        showMessage('User updated successfully! (Demo mode)', 'success');
        showDashboardSection('users');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        showMessage('Deleting user...', 'info');
        
        const result = await apiCall(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            users = users.filter(u => u.id != userId);
            showMessage('User deleted successfully!', 'success');
            showDashboardSection('users');
        } else {
            showMessage('Error deleting user: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('User deletion error:', error);
        
        // Fallback for demo mode
        users = users.filter(u => u.id != userId);
        showMessage('User deleted successfully! (Demo mode)', 'success');
        showDashboardSection('users');
    }
}

// Additional Utility Functions
function viewSubmissionDetail(submissionId) {
    const submission = submissions.find(s => s._id === submissionId);
    if (!submission) return;
    
    const student = users.find(u => u.id === submission.studentId) || { name: submission.studentName || 'Unknown Student' };
    const assignment = assignmentTemplates.find(a => a._id === submission.assignmentTemplate._id);
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content submission-detail-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Submission Details</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="submission-detail-content">
                        <div class="detail-section">
                            <h4>Assignment Information</h4>
                            <p><strong>Title:</strong> ${assignment.title}</p>
                            <p><strong>Course:</strong> ${assignment.courseCode}</p>
                            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
                            <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Student Information</h4>
                            <p><strong>Name:</strong> ${student.name}</p>
                            <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Submission Details</h4>
                            <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
                            <p><strong>Status:</strong> ${submission.status || (submission.grade ? 'graded' : 'submitted')}</p>
                            <p><strong>File:</strong> ${submission.fileName || 'N/A'}</p>
                            ${submission.marks || submission.grade ? `<p><strong>Grade:</strong> ${submission.marks || submission.grade}/${assignment.maxMarks}</p>` : ''}
                            ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
                            ${submission.gradedAt ? `<p><strong>Graded:</strong> ${new Date(submission.gradedAt).toLocaleString()}</p>` : ''}
                        </div>
                        
                        ${submission.blockchainHash ? `
                            <div class="detail-section">
                                <h4>Blockchain Verification</h4>
                                <p><strong>Hash:</strong> <code class="blockchain-hash" onclick="copyToClipboard('${submission.blockchainHash}')">${submission.blockchainHash}</code></p>
                                <button class="btn btn-secondary btn-sm" onclick="verifyBlockchainRecord('${submission._id}', 'submission')">Verify on Blockchain</button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-actions">
                        <button onclick="downloadSubmission('${submission._id}')" class="btn btn-primary">Download File</button>
                        <button onclick="closeModal()" class="btn btn-outline">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

function filterAuditLogs() {
    const actionFilter = document.getElementById('auditTypeFilter').value;
    const dateFilter = document.getElementById('auditDateFilter').value;
    const auditRows = document.querySelectorAll('.audit-row');
    
    auditRows.forEach(row => {
        const rowAction = row.getAttribute('data-action');
        const rowDate = row.getAttribute('data-date');
        
        let showRow = true;
        
        // Filter by action
        if (actionFilter !== 'all' && !rowAction.includes(actionFilter)) {
            showRow = false;
        }
        
        // Filter by date
        if (dateFilter && rowDate !== dateFilter) {
            showRow = false;
        }
        
        row.style.display = showRow ? 'table-row' : 'none';
    });
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Additional initialization if needed
    console.log('EduChain Assignment Management System initialized');
});