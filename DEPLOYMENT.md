# Deployment Guide

This guide covers deploying your Task Management API to various platforms.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Email (Gmail) working
- [ ] Cloudinary configured
- [ ] Local testing completed
- [ ] MongoDB Atlas account created
- [ ] Redis Cloud account created (or Redis hosting)

---

## 🌐 Option 1: Deploy to Render (Recommended - FREE)

**Why Render?** Free tier, easy setup, auto-deploys from GitHub, includes Redis.

### Step 1: Prepare Your Code

**Create `.gitignore` (if not exists):**
```
node_modules/
.env
logs/
uploads/
.DS_Store
```

**Commit your code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trello-api.git
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas (FREE)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a **FREE M0 cluster**
3. **Security** → **Database Access** → Create user (save username/password)
4. **Security** → **Network Access** → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
5. **Database** → **Connect** → **Connect your application**
6. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/trello-api?retryWrites=true&w=majority`

### Step 3: Set Up Redis Cloud (FREE)

1. Go to https://redis.com/try-free/
2. Create account and select **FREE 30MB** plan
3. Create database
4. Copy connection details:
   - Redis Host (e.g., `redis-12345.c123.us-east-1.ec2.cloud.redislabs.com`)
   - Redis Port (default: `12345`)
   - Redis Password

### Step 4: Deploy to Render

1. Go to https://render.com and sign up
2. **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `trello-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables** (click "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/trello-api
   
   JWT_ACCESS_SECRET=generate-a-strong-random-string-here
   JWT_REFRESH_SECRET=generate-another-strong-random-string
   JWT_INVITE_SECRET=generate-third-strong-random-string
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   JWT_INVITE_EXPIRE=7d
   
   REDIS_HOST=redis-12345.c123.us-east-1.ec2.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your_redis_password
   
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@taskmanager.com
   
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   CORS_ORIGIN=https://your-frontend-url.com
   
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf
   ```

6. Click **Create Web Service**

**Your API will be live at:** `https://trello-api.onrender.com`

### Step 5: Seed Production Database

```bash
# Connect to your production database locally
MONGO_URI=mongodb+srv://... npm run seed
```

---

## 🚂 Option 2: Deploy to Railway (Easier - FREE)

**Why Railway?** Simpler than Render, auto-provisions databases.

### Steps:

1. Go to https://railway.app and sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway auto-detects Node.js
5. **Add MongoDB** → Railway provisions it automatically
6. **Add Redis** → Railway provisions it automatically
7. **Variables** → Add all environment variables
8. Click **Deploy**

**Your API will be live at:** `https://your-app.up.railway.app`

---

## ☁️ Option 3: Deploy to Heroku (Popular)

**Note:** Heroku no longer has a free tier, starts at $5/month.

### Steps:

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login:
   ```bash
   heroku login
   ```

3. Create app:
   ```bash
   heroku create trello-api
   ```

4. Add MongoDB addon:
   ```bash
   heroku addons:create mongolab:sandbox
   ```

5. Add Redis addon:
   ```bash
   heroku addons:create heroku-redis:mini
   ```

6. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_ACCESS_SECRET=your_secret
   # ... set all other variables
   ```

7. Deploy:
   ```bash
   git push heroku main
   ```

8. Seed database:
   ```bash
   heroku run npm run seed
   ```

**Your API will be live at:** `https://trello-api.herokuapp.com`

---

## 🐳 Option 4: Deploy to DigitalOcean (Advanced)

**Cost:** $5-10/month for droplet + $8/month for managed MongoDB

### Steps:

1. Create DigitalOcean account
2. Create a **Droplet** (Ubuntu 22.04 LTS, $5/month)
3. SSH into droplet:
   ```bash
   ssh root@your_droplet_ip
   ```

4. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. Install MongoDB:
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   ```

6. Install Redis:
   ```bash
   sudo apt install redis-server
   sudo systemctl start redis
   ```

7. Clone your repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/trello-api.git
   cd trello-api
   npm install
   ```

8. Set up environment:
   ```bash
   nano .env
   # Paste your environment variables
   ```

9. Install PM2 (process manager):
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name trello-api
   pm2 startup
   pm2 save
   ```

10. Set up Nginx reverse proxy:
    ```bash
    sudo apt install nginx
    sudo nano /etc/nginx/sites-available/trello-api
    ```
    
    Paste:
    ```nginx
    server {
        listen 80;
        server_name your_domain.com;

        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    
    Enable:
    ```bash
    sudo ln -s /etc/nginx/sites-available/trello-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. Set up SSL with Let's Encrypt:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com
    ```

---

## 🧪 Testing Your Deployed API

**Health Check:**
```bash
curl https://your-api-url.com/api/v1/health
```

**Login Test:**
```bash
curl -X POST https://your-api-url.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

---

## 🔒 Production Security Checklist

- [ ] Strong JWT secrets (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] CORS configured for your frontend domain only
- [ ] MongoDB authentication enabled
- [ ] Redis password set
- [ ] Email using App Password (not regular password)
- [ ] Rate limiting enabled (already done)
- [ ] HTTPS/SSL enabled
- [ ] Environment variables secure (not in code)
- [ ] Cloudinary URLs not exposed
- [ ] Log sensitive data removed

---

## 📊 Monitoring & Logs

**Render:**
- Go to your service → **Logs** tab

**Railway:**
- Go to your service → **Deployments** → View logs

**Heroku:**
```bash
heroku logs --tail
```

**DigitalOcean:**
```bash
pm2 logs trello-api
```

---

## 🔄 Continuous Deployment

Once set up, these platforms auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Automatically deploys!
```

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Render** | ✅ Yes (with limitations) | $7/month |
| **Railway** | ✅ $5 credit/month | $5/month |
| **Heroku** | ❌ No | $5/month+ |
| **DigitalOcean** | ❌ No | $5/month+ |
| **Vercel** | ✅ Yes (serverless) | $20/month |

**Recommended for Beginners:** Render or Railway

---

## 🚀 Quick Deploy Commands

**Generate Strong Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Test Production Locally:**
```bash
NODE_ENV=production MONGO_URI=your_atlas_uri npm start
```

---

## 📝 Post-Deployment

1. **Update CORS_ORIGIN** to your frontend URL
2. **Seed production database** with initial data
3. **Test all endpoints** with Postman
4. **Monitor logs** for errors
5. **Set up custom domain** (optional)

---

## 🆘 Troubleshooting

**Cannot connect to MongoDB:**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure username/password are correct

**Redis connection failed:**
- Verify Redis host/port/password
- Check Redis Cloud plan is active

**Email not sending:**
- Verify Gmail App Password
- Check 2FA is enabled on Google account

**Deployment fails:**
- Check build logs
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

---

## 📚 Additional Resources

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Redis Cloud Docs](https://docs.redis.com/latest/rc/)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

**Need help?** Check the logs first, then review environment variables!
