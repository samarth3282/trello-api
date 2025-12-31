# Task & Team Management API

A comprehensive backend API for task and team management similar to Jira/Trello, built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Features
- ✅ User registration and login with JWT
- ✅ Role-based access control (Admin, Manager, Member)
- ✅ CRUD operations for Projects, Boards, Tasks, and Comments
- ✅ Project invitations with secure tokens
- ✅ Advanced pagination, filtering, and search
- ✅ Soft delete and restore functionality

### Security
- 🔐 Password hashing with bcrypt
- 🔑 Access and refresh tokens
- 🛡️ Protected routes with middleware
- ⏱️ Rate limiting for sensitive routes
- ✔️ Input validation with Joi
- 🌐 CORS configuration

### Database (MongoDB)
- 📊 Relational data with references and population
- ⚡ Indexing for performance
- 💼 Transactions for critical operations
- 🎯 Schema validation and hooks
- 🌱 Seed scripts for demo data

### Advanced Features
- 📁 File uploads with Multer + Cloudinary
- 📧 Email notifications with Nodemailer
- ⚙️ Background jobs with Bull + Redis
- 📜 Activity logs and audit trails
- 🔄 Real-time updates with WebSockets
- 💾 Redis caching for performance

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Redis (v7 or higher)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trello-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB and Redis:
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Project Endpoints

#### Create Project
```http
POST /api/v1/projects
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "members": [
    {
      "user": "userId",
      "role": "manager"
    }
  ]
}
```

#### Get All Projects
```http
GET /api/v1/projects?page=1&limit=10&search=keyword
Authorization: Bearer <access-token>
```

#### Invite User to Project
```http
POST /api/v1/projects/:projectId/invite
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "member"
}
```

### Board Endpoints

#### Create Board
```http
POST /api/v1/projects/:projectId/boards
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Sprint 1",
  "description": "First sprint board"
}
```

### Task Endpoints

#### Create Task
```http
POST /api/v1/boards/:boardId/tasks
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add JWT authentication",
  "priority": "high",
  "status": "todo",
  "assignedTo": "userId",
  "dueDate": "2025-12-31"
}
```

#### Update Task
```http
PUT /api/v1/tasks/:taskId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "in-progress"
}
```

#### Search & Filter Tasks
```http
GET /api/v1/tasks?status=in-progress&priority=high&assignedTo=userId&search=auth&page=1&limit=20
Authorization: Bearer <access-token>
```

### Comment Endpoints

#### Add Comment
```http
POST /api/v1/tasks/:taskId/comments
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "content": "Great progress on this task!"
}
```

### File Upload

#### Upload Attachment
```http
POST /api/v1/tasks/:taskId/attachments
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

file: <file>
```

## 🏗️ Project Structure

```
trello-api/
├── src/
│   ├── config/           # Configuration files
│   ├── models/           # MongoDB models
│   ├── controllers/      # Route controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── validators/       # Input validation schemas
│   ├── jobs/             # Background jobs
│   ├── sockets/          # WebSocket handlers
│   ├── scripts/          # Utility scripts
│   └── server.js         # Entry point
├── uploads/              # Temporary file storage
├── logs/                 # Application logs
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication with access/refresh tokens
- Role-based access control (RBAC)
- Rate limiting on authentication endpoints
- Input validation and sanitization
- Helmet.js for security headers
- CORS configuration
- Protected routes with authentication middleware

## 🎯 User Roles & Permissions

### Admin
- Full system access
- Manage all projects and users
- Delete any resource

### Manager
- Manage assigned projects
- Create/edit/delete boards and tasks
- Invite users to projects
- Assign tasks to members

### Member
- View assigned projects
- Create and comment on tasks
- Update own tasks
- View project activity

## 📊 Database Schema

### User
- name, email, password (hashed)
- role (admin, manager, member)
- avatar, bio
- emailVerified, isActive
- refreshTokens[]

### Project
- name, description, owner
- members[] (user + role)
- isArchived, deletedAt

### Board
- name, description, project
- order
- isArchived, deletedAt

### Task
- title, description, board
- status (todo, in-progress, review, done)
- priority (low, medium, high, urgent)
- assignedTo, createdBy
- dueDate, attachments[]
- deletedAt

### Comment
- content, task, author
- mentions[], deletedAt

### ActivityLog
- user, action, entity, entityId
- changes, timestamp

## 🚀 Performance Optimizations

- MongoDB indexing on frequently queried fields
- Redis caching for heavy queries
- Pagination for large datasets
- Population with field selection
- Background jobs for async tasks
- Compression middleware

## 🔄 Real-time Features

WebSocket events:
- `task:created`
- `task:updated`
- `task:deleted`
- `comment:added`
- `user:joined`

## 📧 Email Notifications

- Welcome email on registration
- Project invitation emails
- Task assignment notifications
- Comment mention notifications
- Daily digest (background job)

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ using Node.js, Express, and MongoDB
