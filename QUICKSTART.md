# Quick Start Guide

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Redis** (v7 or higher)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

- Set your MongoDB connection string
- Configure JWT secrets (use strong, random strings in production)
- Set up email credentials (for Gmail, use App Passwords)
- Configure Cloudinary credentials for file uploads (optional)
- Update Redis connection details if needed

### 3. Start Required Services

#### Start MongoDB

**Windows:**
```bash
# If installed as a service
net start MongoDB

# Or run directly
mongod
```

**macOS/Linux:**
```bash
# If installed via Homebrew
brew services start mongodb-community

# Or run directly
mongod --config /usr/local/etc/mongod.conf
```

#### Start Redis

**Windows:**
```bash
# If installed via WSL or Windows port
redis-server
```

**macOS:**
```bash
brew services start redis
# Or
redis-server
```

**Linux:**
```bash
sudo systemctl start redis
# Or
redis-server
```

### 4. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This will create:
- 4 test users (admin, manager, 2 members)
- 3 projects with boards and tasks
- Sample comments

**Test Credentials:**
- Admin: `admin@example.com` / `Admin123!`
- Manager: `john@example.com` / `Manager123!`
- Member: `jane@example.com` / `Developer123!`
- Member: `bob@example.com` / `Tester123!`

### 5. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-31T..."
}
```

### Test Authentication

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Save the `accessToken` from the response for authenticated requests.

## Using the API

### Import Postman Collection

Import the `postman_collection.json` file into Postman for easy API testing.

1. Open Postman
2. Click **Import**
3. Select the `postman_collection.json` file
4. Update the `accessToken` variable after logging in

### Make Authenticated Requests

Include the access token in the Authorization header:

```bash
curl -X GET http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running
- Check the `MONGO_URI` in `.env` file
- Verify MongoDB is listening on the correct port

### Redis Connection Error

**Warning:** `Redis Client Error`

**Solution:**
- Ensure Redis is running
- Check Redis configuration in `.env`
- The app will run without Redis, but caching will be disabled

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change the `PORT` in `.env` file
- Or stop the process using port 5000

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

### Email Not Sending

**Issue:** Emails are not being sent

**Solution:**
- Verify email credentials in `.env`
- For Gmail, use App Passwords (not your account password)
- Check email service logs in `logs/combined.log`

## Development Tips

### Watch Logs

**Terminal 1** (Server):
```bash
npm run dev
```

**Terminal 2** (Logs):
```bash
tail -f logs/combined.log
```

### Reset Database

```bash
# Connect to MongoDB
mongosh

# Use the database
use task-management-api

# Drop all collections
db.dropDatabase()

# Re-seed
npm run seed
```

### Monitor Redis

```bash
redis-cli monitor
```

## Next Steps

- Read the full [README.md](README.md) for API documentation
- Explore the API endpoints using Postman
- Check the code structure in the `src/` directory
- Review the models in `src/models/` to understand the data structure

## Support

For issues or questions:
- Check the logs in `logs/` directory
- Review error messages carefully
- Ensure all prerequisites are installed and running

Happy coding! 🚀
