# EduChain - Blockchain Assignment Management System

A comprehensive blockchain-based assignment management system for educational institutions, featuring secure file uploads, role-based access control, and tamper-proof assignment tracking.

## 🚀 Features

- **Blockchain Security**: SHA-256 hashing and immutable record keeping
- **MetaMask Integration**: Secure wallet connection for transactions
- **Role-Based Access**: Student, Lecturer, and Admin roles with specific permissions
- **File Management**: Secure file upload and download with type validation
- **Audit Trail**: Complete logging of all system activities
- **Real-time Grading**: Assignment grading and feedback system
- **Export Functionality**: Excel export for assignments and audit logs

## 📁 Project Structure

```
educhain/
├── api/
│   └── index.js          # Express server and API routes
├── public/
│   ├── index.html        # Main HTML file
│   └── app.js           # Frontend JavaScript
├── package.json         # Node.js dependencies
├── vercel.json          # Vercel deployment configuration
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer middleware
- **Blockchain**: MetaMask integration, crypto-js for hashing
- **Deployment**: Vercel serverless functions

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB database (MongoDB Atlas recommended)
- Git for version control

## 🚀 Deployment to Vercel

### Step 1: Prepare MongoDB Database

1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (replace `<username>` and `<password>`)

### Step 2: Deploy to Vercel

1. **Fork or Clone this repository**
   ```bash
   git clone <your-repo-url>
   cd educhain
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy the application**
   ```bash
   vercel
   ```

5. **Add Environment Variables**
   
   In the Vercel dashboard, go to your project → Settings → Environment Variables and add:
   
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`

6. **Redeploy after adding environment variables**
   ```bash
   vercel --prod
   ```

### Step 3: Configure Domain (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain or use the provided `.vercel.app` domain

## 🔧 Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd educhain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your MongoDB URI:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educhain
   NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:3000` in your browser

## 👥 Default User Accounts

The system automatically creates these default accounts:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Administrator |
| lecturer | password123 | Lecturer |
| student | password123 | Student |

## 🔐 Security Features

- File type validation (PDF, DOC, DOCX, TXT, ZIP only)
- File size limits (10MB maximum)
- Role-based route protection
- Input sanitization and validation
- Secure file storage with unique naming

## 📱 Browser Support

- Chrome (recommended for MetaMask integration)
- Firefox
- Safari
- Edge

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify your MONGODB_URI in environment variables
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure database user has correct permissions

2. **File Upload Errors**
   - Check file size (must be under 10MB)
   - Verify file type is supported
   - Ensure proper form encoding (`multipart/form-data`)

3. **MetaMask Connection Issues**
   - Install MetaMask browser extension
   - Use a supported browser (Chrome recommended)
   - Check if MetaMask is unlocked

### Debug Endpoints

The application includes debug endpoints for troubleshooting:

- `GET /api/debug` - Check system status and database connectivity
- `POST /api/manual-seed` - Manually seed the database with default users
- `GET /api/health` - Basic health check

## 📄 API Documentation

### Authentication
- `POST /api/auth/login` - User login with wallet integration

### Assignments
- `POST /api/assignments/submit` - Submit new assignment (multipart/form-data)
- `GET /api/assignments/student/:id` - Get assignments for specific student
- `GET /api/assignments/all` - Get all assignments (lecturer/admin only)
- `GET /api/assignments/submission/:id` - Get specific assignment details
- `PUT /api/assignments/grade/:id` - Grade an assignment
- `GET /api/assignments/download/:id` - Download assignment file

### Users
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user (admin only)

### Audit
- `GET /api/audit` - Get audit logs (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or need help with deployment:

1. Check the troubleshooting section above
2. Review the Vercel deployment logs
3. Ensure all environment variables are correctly set
4. Verify MongoDB connectivity

## 🔄 Updates and Maintenance

To update your deployed application:

1. Make changes to your code
2. Commit and push to your repository
3. Vercel will automatically redeploy (if connected to Git)
4. Or run `vercel --prod` for manual deployment

## 🏗 Architecture

The application uses a serverless architecture:

- **Frontend**: Static files served by Vercel CDN
- **Backend**: Serverless functions handling API requests
- **Database**: MongoDB Atlas for data persistence
- **File Storage**: Temporary storage in `/tmp` directory (Vercel limitation)

Note: Due to Vercel's serverless architecture, uploaded files are stored temporarily. For production use, consider integrating with a cloud storage service like AWS S3 or Google Cloud Storage for persistent file storage.