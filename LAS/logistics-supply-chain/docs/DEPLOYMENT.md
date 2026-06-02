# Deployment Guide

## Local Development

### Quick Start (5 minutes)

```bash
# 1. Clone and navigate
cd logistics-supply-chain

# 2. Install dependencies
npm install

# 3. Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your API keys:
# - GOOGLE_MAPS_API_KEY
# - DATABASE credentials (if not using Docker)
# - JWT_SECRET

# 4. Start with Docker (recommended)
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:3001
# - Backend: http://localhost:3000
# - ML Server: http://localhost:5000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Local Development Without Docker

**Prerequisites:**
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000 (React dev server)

# Terminal 3: ML Server
cd ml-models
pip install -r requirements.txt
python server.py
# Runs on http://localhost:5000
```

## Database Setup

### Initialize PostgreSQL

```bash
# Using Docker (automatic via docker-compose.yml)
docker-compose up postgres
```

### Manual Setup

```bash
# Connect to PostgreSQL
psql -U postgres -d logistics_db

# Run schema
\i backend/database/schema.sql

# Verify tables
\dt
```

### Database Migrations

```bash
# Create migration
npm run db:migrate

# Seed sample data
npm run db:seed
```

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/logistics_db
DB_POOL_SIZE=20

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=24h

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
ML_SERVER_URL=http://ml-server:5000

# Caching
REDIS_URL=redis://redis:6379
REDIS_TTL=3600

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15min
RATE_LIMIT_MAX=1000

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_MAPS_KEY=your-google-maps-key
REACT_APP_ENV=production
REACT_APP_SOCKET_URL=https://api.yourdomain.com
REACT_APP_OFFLINE_ENABLED=true
```

## Deployment Options

### Option 1: Docker Compose (Small Scale)

Best for: Development, staging, small production

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Scaling:**
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

### Option 2: Kubernetes (Enterprise)

**Prerequisites:**
- Kubernetes cluster (EKS, GKE, AKS)
- kubectl configured
- Docker images in registry

**Deployment:**

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logistics-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/logistics-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: token
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

**Apply:**
```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ml-deployment.yaml
kubectl apply -f postgresql-statefulset.yaml
kubectl apply -f redis-deployment.yaml
```

### Option 3: AWS (ECS/Lambda)

**ECS Deployment:**

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

docker build -t logistics-backend:latest backend/
docker tag logistics-backend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/logistics-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/logistics-backend:latest
```

**Use AWS CloudFormation or AWS Copilot:**
```bash
copilot app init logistics
copilot svc init --name backend --svc-type "Load Balanced Web Service"
copilot svc deploy
```

### Option 4: Heroku (Rapid Deployment)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create logistics-supply-chain

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set DATABASE_URL=your-postgres-url
heroku config:set REDIS_URL=your-redis-url

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Production Configuration

### Nginx Reverse Proxy

```nginx
upstream backend {
  server backend:3000;
}

upstream ml_server {
  server ml-server:5000;
}

server {
  listen 80;
  server_name yourdomain.com;
  
  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;
  
  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
  
  # Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
  
  # Security headers
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  
  # API routes
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_request_buffering off;
  }
  
  # ML routes
  location /ml/ {
    proxy_pass http://ml_server;
    proxy_set_header Host $host;
  }
  
  # WebSocket
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
  
  # Frontend
  location / {
    root /var/www/html;
    try_files $uri $uri/ /index.html;
  }
}
```

### SSL/TLS Setup

```bash
# Using Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/logistics"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -U postgres logistics_db > \
  $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz \
  s3://your-backup-bucket/
```

### Monitoring & Logging

```bash
# Application Logging
# Use ELK Stack (Elasticsearch, Logstash, Kibana)

# Metrics
# Prometheus + Grafana

# Error Tracking
# Sentry integration

# Example Sentry setup:
npm install @sentry/node @sentry/tracing
```

### Performance Optimization

```bash
# Enable caching headers
Cache-Control: public, max-age=3600

# CDN for static assets
# CloudFlare, AWS CloudFront, or similar

# Database optimization
# - Connection pooling (PgBouncer)
# - Query optimization
# - Index optimization

# API optimization
# - Response compression (gzip)
# - Pagination
# - Lazy loading
```

### Security Hardening

```bash
# 1. Update dependencies regularly
npm audit
npm audit fix

# 2. Run security scans
npm run lint
npm test

# 3. Environment secrets
# Use vault/secrets manager (AWS Secrets Manager, HashiCorp Vault)

# 4. Rate limiting
# Implement in Nginx/API

# 5. CORS configuration
# Whitelist allowed origins

# 6. Helmet.js for security headers
npm install helmet

# 7. SQL injection prevention
# Use parameterized queries (already implemented)

# 8. DDoS protection
# CloudFlare, AWS Shield
```

## Monitoring & Health Checks

### Health Endpoints

```
GET /health                   # API health
GET /api/health              # Backend API
GET /ml/health               # ML server
GET /db-health               # Database
GET /redis-health            # Redis cache
```

### Alerts

**Set up alerts for:**
- API response time > 1s
- Error rate > 5%
- Database connection pool > 80%
- Redis memory > 80%
- CPU > 80%
- Disk space < 10%

## Troubleshooting Deployment

### Backend won't start
```bash
# Check logs
docker logs logistics_backend

# Check environment variables
docker exec logistics_backend env | grep DATABASE_URL

# Test database connection
npm run test:db-connection
```

### Frontend not loading
```bash
# Check API connection
curl http://localhost:3000/health

# Check CORS headers
curl -H "Origin: http://yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:3000/api/inventory -v
```

### ML Server errors
```bash
# Check dependencies
pip list | grep tensorflow

# Test ML endpoint
curl http://localhost:5000/health
```

### Database issues
```bash
# Check connection
pg_isready -h localhost -p 5432

# Verify credentials
psql -h localhost -U postgres -d logistics_db -c "\dt"
```

## Rollback Procedure

```bash
# Docker Compose
docker-compose down
git checkout previous-version
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/logistics-backend

# AWS ECS
aws ecs update-service \
  --cluster logistics \
  --service backend \
  --force-new-deployment
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] SSL/TLS certificates installed
- [ ] Environment variables configured
- [ ] Backups enabled and tested
- [ ] Monitoring and logging configured
- [ ] Health checks passing
- [ ] Load balancing configured
- [ ] CDN configured for static assets
- [ ] DNS records updated
- [ ] Firewall rules configured
- [ ] Security scan completed
- [ ] Performance baseline established
- [ ] Team trained on deployment process
