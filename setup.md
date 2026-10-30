# Complete AWS, AI & CI/CD Setup Guide

This guide provides end-to-end instructions for developers to provision AWS infrastructure, obtain necessary API keys, configure GitHub repository secrets, and execute automated deployments for the **Fitness Microservices Platform**.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [AWS IAM User & Access Keys Setup](#2-aws-iam-user--access-keys-setup)
3. [AWS EC2 Instance Provisioning (Ubuntu, RSA .pem, 40 GB Disk)](#3-aws-ec2-instance-provisioning)
4. [EC2 Server Configuration (Docker & Permissions)](#4-ec2-server-configuration)
5. [Google Gemini AI Studio API Key](#5-google-gemini-ai-studio-api-key)
6. [Database Credentials & Passwords](#6-database-credentials--passwords)
7. [GitHub Repository Secrets Configuration](#7-github-repository-secrets-configuration)
8. [Developer Workflow: Committing & Pushing to GitHub](#8-developer-workflow-committing--pushing-to-github)
9. [Verifying Deployment & Troubleshooting](#9-verifying-deployment--troubleshooting)

---

## 1. Prerequisites
Before beginning, ensure you have:
* An active **[AWS Account](https://aws.amazon.com/)** with administrative or IAM permissions.
* A **[Google Account](https://accounts.google.com/)** for Google AI Studio.
* A **[GitHub Account](https://github.com/)** with write/admin access to this repository.
* A local terminal (macOS/Linux Terminal, Windows WSL, or Git Bash).

---

## 2. AWS IAM User & Access Keys Setup

GitHub Actions requires an IAM user with programmatic credentials to push Docker images to Amazon Elastic Container Registry (ECR).

### Step-by-Step Instructions:
1. Log in to the **[AWS Management Console](https://console.aws.amazon.com/)**.
2. In the top search bar, search for **IAM** and select it (or go directly to [https://console.aws.amazon.com/iam/](https://console.aws.amazon.com/iam/)).
3. In the left navigation menu, click **Users**, then click the orange **Create user** button.
4. **Step 1 - Specify user details:**
   * **User name:** `github-actions-fitness`
   * Leave *"Provide user access to the AWS Management Console"* **unchecked** (this user is only for CI/CD automation).
   * Click **Next**.
5. **Step 2 - Set permissions:**
   * Select **Attach policies directly**.
   * In the *Permissions policies* search bar, type `AmazonEC2ContainerRegistryFullAccess`.
   * Check the checkbox next to **`AmazonEC2ContainerRegistryFullAccess`**.
   * Click **Next**.
6. **Step 3 - Review and create:**
   * Click **Create user**.
7. **Step 4 - Generate Access Key & Secret:**
   * Click on the newly created user `github-actions-fitness` in the list.
   * Go to the **Security credentials** tab.
   * Scroll down to the **Access keys** section and click **Create access key**.
   * Under *Use case*, select **Command Line Interface (CLI)** or **Third-party service**.
   * Check the box: *"I understand the above recommendation and want to proceed to create an access key."*
   * Click **Next** ➔ click **Create access key**.
8. **Step 5 - Save the Credentials:**
   * Copy the **Access key ID** (starts with `AKIA...`). This is `AWS_ACCESS_KEY_ID`.
   * Click **Show** and copy the **Secret access key** (40 characters). This is `AWS_SECRET_ACCESS_KEY`.
   * *(Optional)* Download the `.csv` file as backup. Store these safely; you cannot view the secret key again.
9. **Identify your AWS Region:**
   * Look at the top-right corner of the AWS Console (e.g., `us-east-2`, `ap-south-1`, `ap-south-2`).
   * This is your `AWS_REGION`.

---

## 3. AWS EC2 Instance Provisioning

We run the entire microservices stack (PostgreSQL, MongoDB, Kafka, Keycloak, Spring Boot services, and React Frontend) inside Docker containers on a single EC2 virtual machine.

### Step-by-Step Instructions:
1. In the AWS Console, search for **EC2** and navigate to [https://console.aws.amazon.com/ec2/](https://console.aws.amazon.com/ec2/).
2. In the left menu, click **Instances**, then click the orange **Launch instances** button.
3. **Name and tags:**
   * Name: `fitness-microservices-server`
4. **Application and OS Images (Amazon Machine Image):**
   * Select **Ubuntu**.
   * Choose **Ubuntu Server 24.04 LTS (HVM)** or **Ubuntu Server 22.04 LTS (HVM)** (64-bit x86).
5. **Instance type:**
   * Select **`t3.large`** (2 vCPUs, 8 GiB Memory) or **`t3.xlarge`** (4 vCPUs, 16 GiB Memory).
   * *Note:* 8 GiB+ RAM is recommended because running 6 Spring Boot JVMs, Kafka, MongoDB, PostgreSQL, and Keycloak simultaneously requires approximately 4–6 GB of memory.
6. **Key pair (login):**
   * Click **Create new key pair**.
   * **Key pair name:** `fitness-ec2-key`
   * **Key pair type:** **RSA**
   * **Private key file format:** **`.pem`** (for OpenSSH / macOS / Linux / Git Bash)
   * Click **Create key pair**.
   * ⚠️ **A file named `fitness-ec2-key.pem` will automatically download. Do not lose or delete this file!**
7. **Network settings (Security Group):**
   * Click **Edit** (top right of Network settings).
   * Keep **Auto-assign public IP** set to **Enable**.
   * Security group rule configuration:
     * **Rule 1 (SSH):** Type: `SSH`, Port: `22`, Source: `Anywhere` (`0.0.0.0/0`) or `My IP`.
     * **Rule 2 (Frontend Web):** Click *Add security group rule* ➔ Type: `HTTP`, Port: `80`, Source: `Anywhere` (`0.0.0.0/0`).
     * **Rule 3 (Keycloak Auth):** Click *Add security group rule* ➔ Type: `Custom TCP`, Port: `8080`, Source: `Anywhere` (`0.0.0.0/0`).
     * **Rule 4 (API Gateway):** Click *Add security group rule* ➔ Type: `Custom TCP`, Port: `8086`, Source: `Anywhere` (`0.0.0.0/0`).
     * *(Optional)* **Rule 5 (Frontend Alt):** Type: `Custom TCP`, Port: `5173`, Source: `Anywhere` (`0.0.0.0/0`).
8. **Configure storage (Volume Size):**
   * In the storage section, change the root volume size from `8 GiB` to **`40 GiB`**.
   * Volume type: **General Purpose SSD (gp3)**.
9. **Launch:**
   * Click the orange **Launch instance** button.

---

## 4. EC2 Server Configuration

Once the EC2 instance status turns to **Running**, extract its details and prepare the Docker runtime.

### Step 1: Extract EC2 Variables
1. Go to **EC2 > Instances** and click on your new instance.
2. Under the **Details** tab, locate:
   * **Public IPv4 address:** (e.g., `40.192.58.65`). This is `EC2_HOST`.
   * **Default Username:** For Ubuntu, this is always `ubuntu`. This is `EC2_USER`.
3. Locate your downloaded `fitness-ec2-key.pem` file on your local machine:
   * Open the file in VS Code or run `cat fitness-ec2-key.pem` in your terminal.
   * The file starts with `-----BEGIN RSA PRIVATE KEY-----` and ends with `-----END RSA PRIVATE KEY-----`.
   * This entire multi-line block is your `EC2_SSH_KEY`.

### Step 2: One-Time Docker Setup on EC2
Open a terminal on your local computer where `fitness-ec2-key.pem` is located, set file permissions, and connect via SSH:

```bash
# 1. Restrict key permissions (required by SSH):
chmod 400 fitness-ec2-key.pem

# 2. SSH into your EC2 server (replace with your instance IP):
ssh -i fitness-ec2-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Once connected to the EC2 server, run the following commands to install Docker and Docker Compose:

```bash
# Update package indices
sudo apt-get update

# Install Docker and Docker Compose plugin
sudo apt-get install -y docker.io docker-compose-v2

# Allow the ubuntu user to run Docker without sudo
sudo usermod -aG docker ubuntu

# Apply user group changes
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

Exit the SSH session:
```bash
exit
```

---

## 5. Google Gemini AI Studio API Key

The AI service consumes activity events from Kafka and requests personalized workout feedback from Google Gemini AI.

### Step-by-Step Instructions:
1. Open your browser and navigate to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Sign in with your Google Account.
3. Click the blue **Create API key** (or **Get API key**) button.
4. Select **Create API key in new project** (or choose an existing Google Cloud project).
5. Copy the generated API key string (e.g., `AIzaSy...`).
6. This key is your **`GEMINI_KEY`**.

---

## 6. Database Credentials & Passwords

The application uses PostgreSQL 16 for user identity and Keycloak storage.

* **`DB_PASSWORD`:** Choose a strong password (e.g., `Password@123!` or any secure alphanumeric string).
* In GitHub Secrets, store this under the secret name **`DB_PASSWORD`**.
* The CI/CD pipeline dynamically passes this password into `.env` on EC2, ensuring no passwords are hardcoded in git.

---

## 7. GitHub Repository Secrets Configuration

To connect GitHub Actions to your AWS account and EC2 server, add the credentials as encrypted repository secrets.

### How to Add Secrets:
1. Open your repository on GitHub.
2. Click **Settings** (tab at the top right).
3. In the left navigation menu, click **Secrets and variables** ➔ select **Actions**.
4. Click the green **New repository secret** button for each variable below:

| Secret Name | Value Description | Example Value |
| :--- | :--- | :--- |
| **`AWS_ACCESS_KEY_ID`** | 20-character Access Key ID from IAM | `AKIAIOSFODNN7EXAMPLE` |
| **`AWS_SECRET_ACCESS_KEY`** | 40-character Secret Access Key from IAM | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| **`AWS_REGION`** | AWS Region where EC2 & ECR are located | `ap-south-2` *(or `us-east-2`, `ap-south-1`)* |
| **`EC2_HOST`** | Public IPv4 address of your EC2 instance | `40.192.58.65` |
| **`EC2_USER`** | Default SSH username for the Ubuntu instance | `ubuntu` |
| **`EC2_SSH_KEY`** | Full content of your downloaded `.pem` key file | `-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----` |
| **`GEMINI_KEY`** | Google Gemini API key from Google AI Studio | `AIzaSy...` |
| **`DB_PASSWORD`** | PostgreSQL database password | `Password@123!` |

---

## 8. Developer Workflow: Committing & Pushing to GitHub

Whenever you make small changes, follow this standard Git workflow. Every push to the `main` branch automatically triggers the deployment.

### 1. Check Working Tree Status
Always check what files were modified or untracked before committing:
```bash
git status
```

### 2. Stage Specific Changes
Stage files individually or stage all changes respecting the `.gitignore`:
```bash
# Stage all changes
git add .

# Or stage specific files
git add fitness-frontend/src/App.jsx
git add .github/workflows/deploy.yml
```

### 3. Commit with Clear Conventional Messages
Create concise, descriptive commits:
```bash
git commit -m "feat: enhance activity summary metrics in dashboard"
```

### 4. Pull Latest Remote Changes (Avoid Conflicts)
Before pushing, rebase with any recent changes from the remote repository:
```bash
git pull --rebase origin main
```

### 5. Push to GitHub to Trigger Deployment
```bash
git push origin main
```

---

## 9. Verifying Deployment & Troubleshooting

### 1. Monitor CI/CD Execution
1. In your GitHub repository, click the **Actions** tab at the top.
2. Click on the latest workflow run: **"Fitness CI/CD to AWS ECR and EC2"**.
3. You can watch real-time console logs for:
   * **Job 1 (`build-and-push-ecr`):** Compiling Maven JARs, building Vite frontend, and pushing container images to Amazon ECR.
   * **Job 2 (`deploy-to-ec2`):** SSH connection to EC2, logging Docker into ECR, pulling images, and starting all containers via Docker Compose.

### 2. Verify Running Containers on EC2
To inspect the running services directly on your EC2 instance:
```bash
ssh -i fitness-ec2-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>

cd ~/fitness-app
docker compose -f docker-compose.prod.yml ps
```

You should see all containers with status `Up` or `healthy`:
* `fitness-postgres` (Port 5433:5432)
* `fitness-mongodb` (Port 27017)
* `fitness-kafka` (Port 9092)
* `fitness-keycloak` (Port 8080)
* `fitness-configserver` (Port 8888)
* `fitness-eureka` (Port 8761)
* `fitness-userservice` (Port 8084)
* `fitness-activityservice` (Port 8083)
* `fitness-aiservice` (Port 8087)
* `fitness-gateway` (Port 8086)
* `fitness-frontend` (Port 80)

### 3. Accessing the Live Application
* **Frontend Web App:** `http://<YOUR_EC2_PUBLIC_IP>` (e.g., `http://40.192.58.65`)
* **Keycloak Admin Console:** `http://<YOUR_EC2_PUBLIC_IP>:8080` (Username: `admin`, Password: `admin`)
* **Eureka Service Dashboard:** `http://<YOUR_EC2_PUBLIC_IP>:8761`
* **API Gateway Health:** `http://<YOUR_EC2_PUBLIC_IP>:8086/actuator/health`

### 4. Viewing Live Service Logs
If any service experiences issues, view live logs on the EC2 instance:
```bash
# View logs for a specific service (e.g., ai-service)
docker compose -f docker-compose.prod.yml logs -f aiservice

# View logs for the gateway
docker compose -f docker-compose.prod.yml logs -f gateway

# View logs for all services
docker compose -f docker-compose.prod.yml logs -f
```
