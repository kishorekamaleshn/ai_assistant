# Cloud Deployment Strategy

This document outlines the strategy for deploying the AI-Powered Query Assistant to AWS using Docker containers and path-based routing.

## Chosen Architecture: Application Load Balancer (ALB) + ECS Fargate

To ensure a seamless, single-domain experience for users without dealing with CORS issues in production, we will deploy both the frontend and backend behind a single **Application Load Balancer (ALB)** using path-based routing.

### The Routing Strategy (ALB)
The ALB acts as the single entry point for all traffic. It is configured with listener rules:
- **`Path: /api/*`**: Forwards requests to the **Backend** ECS Target Group.
- **`Path: /*`**: Forwards all other requests to the **Frontend** Target Group (or S3/CloudFront if serving static files separately).

---

### 1. Backend: ECR -> ECS Fargate
The FastAPI backend is containerized and stateless, making it ideal for AWS Fargate.

**Steps:**
1. **Container Registry (ECR)**: Build the backend Docker image locally and push it to an Amazon Elastic Container Registry (ECR) repository.
   ```bash
   docker build -t ai-query-assistant-backend .
   docker tag ai-query-assistant-backend:latest <account_id>.dkr.ecr.<region>.amazonaws.com/backend:latest
   docker push <account_id>.dkr.ecr.<region>.amazonaws.com/backend:latest
   ```
2. **Task Definition**: Create an ECS Task Definition using the Fargate launch type.
   - Reference the image URI from ECR.
   - Securely inject environment variables (`GEMINI_API_KEY`, `JWT_SECRET`) using AWS Systems Manager Parameter Store or AWS Secrets Manager.
3. **ECS Service**: Create a Fargate Service to run the task.
   - Attach it to the Backend Target Group associated with the ALB.
   - The ALB health checks will ping `/api/health` to ensure the container is ready to accept traffic.
4. **Auto-scaling**: Configure auto-scaling rules based on CPU utilization to handle traffic spikes.

---

### 2. Frontend: Static Hosting or Container
Since we are using an ALB with path-based routing, we have two excellent options for the frontend:

**Option A (CloudFront + S3 - Recommended for React SPA):**
1. Build the React app (`npm run build`).
2. Upload the `dist` folder to an S3 bucket configured for website hosting.
3. Put CloudFront in front of the ALB. CloudFront routes `/api/*` to the ALB (Backend) and `/*` directly to S3. This provides global edge-caching for the UI and is highly cost-effective.

**Option B (Containerized Frontend):**
1. Write a Dockerfile for the frontend using `nginx` to serve the static built files.
2. Push the image to ECR and deploy it as a separate ECS Fargate service.
3. Configure the ALB listener rule so `/*` routes to the Frontend Target Group.

---

### 3. Continuous Integration/Continuous Deployment (CI/CD)
To automate the deployment, we use GitHub Actions:
- **On Push to `main`**: 
  - Backend: Build Docker image -> Push to ECR -> Update ECS Service (force new deployment).
  - Frontend: `npm run build` -> Sync to S3 -> Invalidate CloudFront cache.

### Summary for the Interviewer
By prefixing all backend routes with `/api`, we demonstrate foresight into production infrastructure. It allows us to deploy the entire application behind a single Load Balancer (or API Gateway/CloudFront distribution). This eliminates preflight CORS requests in production, simplifies DNS management, and cleanly separates the frontend static assets from the compute-heavy AI backend.
