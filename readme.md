# Fitness Microservices Platform — Documentation & Guide

This document serves as the single source of truth for AI agents and human developers interacting with, extending, and maintaining the **Fitness Microservices Platform**.

---

## 1. Project Overview

The **Fitness Microservices Platform** is an enterprise-grade, event-driven fitness tracking application built on **Java 21**, **Spring Boot 4.x**, **Spring Cloud 2025.x**, **Apache Kafka**, **PostgreSQL**, **MongoDB**, **Google Gemini AI**, and a **React 19 / Vite** frontend with **Keycloak OAuth2 / OIDC** authentication.

### Core Capabilities:
- **Identity & Access Management:** User authentication via Keycloak (OAuth2 Authorization Code flow with PKCE), automated user provisioning & synchronization between Keycloak and the internal PostgreSQL user repository.
- **Activity Tracking:** Logging workouts (running, cycling, walking, swimming, HIIT, etc.) with metrics (duration, calories burned, start time, dynamic custom metrics) persisted in MongoDB.
- **Asynchronous AI Recommendations:** Real-time event streaming via Apache Kafka when activities are created; consumed by an AI service that calls Google Gemini AI to generate customized workout performance analyses, improvement areas, future workout suggestions, and safety guidance.
- **Biometric Analytics & Frontend Dashboard:** Interactive React 19 single-page application built with Material UI (MUI v9), dynamic SVG route visualizations, biometric KPI rings, and activity details.
- **Cloud-Native Architecture:** Centralized Spring Cloud Config Server, Netflix Eureka discovery, Spring Cloud Gateway with reactive filters, Docker containerization, and AWS ECS rolling deployment pipeline via GitHub Actions.

---

## 2. Architecture & Service Topology

```
                                      +---------------------------------------------+
                                      |            Keycloak (Port 8080)             |
                                      |       OAuth2 / OIDC (fitness-app)           |
                                      +---------------------------------------------+
                                                       ^          ^
                                            PKCE Auth  |          | JWKS Token Validation
                                                       |          v
+-----------------------------+           +-----------------------------------------+
|      Fitness Frontend       |  HTTPS    |               API Gateway               |
|      React 19 + Vite        | --------> |        Spring Cloud Gateway WebFlux     |
|         (Port 5173)         |  (8086)   |  - Auth validation & KeycloakUserSync   |
+-----------------------------+           +-----------------------------------------+
                                                       |               |           |
                              /api/v1/**               |               |           | /api/recommendations/**
                +--------------------------------------+               |           +-----------------------+
                |                                                      |                                   |
                v                                                      v                                   v
+-------------------------------+                     +-------------------------------+     +-------------------------------+
|         User Service          |                     |       Activity Service        |     |          AI Service           |
|          (Port 8084)          | <--- Synchronous -- |          (Port 8083)          |     |          (Port 8087)          |
|    Spring Boot + PostgreSQL   |      WebClient      |     Spring Boot + MongoDB     |     |     Spring Boot + MongoDB     |
+-------------------------------+      Validation     +-------------------------------+     +-------------------------------+
                |                                                      |                                   ^
                v                                                      v Kafka Producer                    | Kafka Consumer
        +---------------+                                     +-----------------------------------------+  |
        |  PostgreSQL   |                                     |          Kafka (KRaft Mode)             |  |
        |  (Port 5433)  |                                     |        Topic: activity-events           | -+
        |  `fitnessapp` |                                     +-----------------------------------------+
        +---------------+                                                      |
                                                                               v
                                                              +---------------------------------+
                                                              |        Google Gemini API        |
                                                              |  gemini-3.6-flash / interactions|
                                                              +---------------------------------+

                      +----------------------------------------------------+
                      | Service Discovery: Eureka Server (Port 8761)        |
                      | Central Config: Spring Cloud Config (Port 8888)    |
                      +----------------------------------------------------+
```

---

## 3. Technology Stack Breakdown

| Layer | Component | Version / Technologies |
|---|---|---|
| **Language & Runtime** | Java | Java 21 (Eclipse Temurin JDK 21) |
| **Backend Framework** | Spring Boot & Spring Cloud | Spring Boot `4.1.0`, Spring Cloud `2025.1.2` |
| **Service Discovery** | Netflix Eureka | `spring-cloud-starter-netflix-eureka-server` / `client` |
| **Configuration** | Spring Cloud Config Server | Native filesystem profile (`classpath:/config/`) |
| **API Gateway** | Spring Cloud Gateway | Reactive WebFlux, OAuth2 Resource Server, Nimbus JWT |
| **Relational Database** | PostgreSQL | Port `5433` (dev) / `5432` (prod), Spring Data JPA, Hibernate |
| **Document Database** | MongoDB | Port `27017`, Spring Data MongoDB |
| **Event Streaming** | Apache Kafka | Image `apache/kafka:4.3.1` (KRaft broker+controller mode), Spring Kafka |
| **Artificial Intelligence**| Google Gemini | `gemini-3.6-flash` via Google Generative Language REST API |
| **Frontend Framework** | React + Vite | React `19.2.8`, Vite `8.2.1`, JavaScript (ESM) |
| **UI & Styling** | Material UI (MUI) | `@mui/material` `9.3.1`, `@emotion/react`, Custom Design Tokens |
| **State Management** | Redux Toolkit | `@reduxjs/toolkit` `2.12.0`, `react-redux` `9.3.0` |
| **Routing & Auth** | React Router & PKCE | `react-router-dom` `7.18.2`, `react-oauth2-code-pkce` `1.24.0` |
| **CI/CD & Cloud** | AWS ECS & ECR | GitHub Actions, Amazon ECR, Amazon ECS rolling deployment |

---

## 4. Repository & File Structure

> **CRITICAL NOTE ON DIRECTORY STRUCTURE:**
> Several microservice subprojects are nested two levels deep (e.g., `userservice/userservice`). Ensure you execute Maven or navigate to the inner directory where `pom.xml` resides.

```
fitnessmicroservices/
├── readme.md                                # Main documentation
├── .agent.md                                # Agent rules and developer guide
├── docker-compose.yml                       # Backing infrastructure (Postgres, Kafka, Keycloak)
├── keycloak/
│   └── realm-export.json                    # Automated Keycloak realm import definition
├── .github/
│   └── workflows/
│       └── deploy.yml                       # GitHub Actions CI/CD to AWS ECR & ECS
├── configserver/
│   └── configserver/                        # [Config Server Root]
│       ├── pom.xml
│       ├── Dockerfile
│       └── src/main/resources/
│           ├── application.yml              # Config server port 8888, native search locations
│           ├── application-prod.yml
│           ├── gateway-service.yml          # Routes, security JWKS URI, Eureka config
│           ├── gateway-service-prod.yml
│           ├── user-service.yml             # PostgreSQL datasource & JPA config
│           ├── user-service-prod.yml
│           ├── activity-service.yml         # MongoDB & Kafka producer config
│           ├── activity-service-prod.yml
│           ├── ai-service.yml               # MongoDB, Kafka consumer, Gemini API config
│           └── ai-service-prod.yml
├── eureka/
│   └── eureka/                              # [Eureka Server Root]
│       ├── pom.xml
│       └── src/main/resources/application.yml # Port 8761, register-with-eureka: false
├── gateway/
│   └── gateway/                             # [API Gateway Root]
│       ├── pom.xml
│       ├── Dockerfile
│       └── src/main/java/com/fitness/gateway/
│           ├── GatewayApplication.java
│           ├── SecurityConfig.java          # WebFlux security & CORS definition
│           ├── KeycloakUserSyncFilter.java  # JWT extraction & automated user sync
│           └── user/                        # WebClient caller to User Service
│               ├── UserService.java
│               ├── WebClientConfig.java
│               ├── RegisterRequest.java
│               └── UserResponse.java
├── userservice/
│   └── userservice/                         # [User Service Root]
│       ├── pom.xml
│       ├── Dockerfile
│       └── src/main/java/com/fitness/userservice/
│           ├── UserserviceApplication.java
│           ├── controller/UserController.java # /api/v1 endpoints
│           ├── services/UserService.java
│           ├── repository/UserRepository.java
│           ├── models/                      # User entity (Postgres table: user_table)
│           └── dto/                         # RegisterRequest, UserResponse
├── activityservice/
│   └── activityservice/                     # [Activity Service Root]
│       ├── pom.xml
│       ├── Dockerfile
│       └── src/main/java/com/fitness/activityservice/
│           ├── ActivityserviceApplication.java
│           ├── controller/ActivityController.java # /api/activities endpoints
│           ├── services/
│           │   ├── ActivityService.java     # Saves to Mongo, publishes to Kafka
│           │   └── UserValidationService.java # Sync call to User Service via WebClient
│           ├── repository/ActivityRepository.java
│           ├── model/Activity.java          # Mongo collection: aiactivityfitness
│           └── config/WebClientConfig.java  # Load-balanced WebClient for USER-SERVICE
├── aiservice/
│   └── aiservice/                           # [AI Service Root]
│       ├── pom.xml
│       ├── Dockerfile
│       └── src/main/java/com/fitness/aiservice/
│           ├── AiserviceApplication.java
│           ├── controller/RecommendationController.java # /api/recommendations endpoints
│           ├── services/
│           │   ├── ActivityMessageListener.java # Kafka listener on topic activity-events
│           │   ├── ActivityAiService.java   # Prompt construction & JSON output parser
│           │   ├── GeminiService.java       # HTTP WebClient caller to Google Gemini API
│           │   └── RecommendationService.java
│           ├── repository/RecommendationRepository.java
│           └── model/Recommendation.java    # Mongo collection: airecommendationfitness
├── kafka/
│   └── Dockerfile                           # Apache Kafka 4.3.1 KRaft single-node image
└── fitness-frontend/                        # [React Frontend Root]
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile                           # Nginx production build server
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                          # Main routing, hero view & dashboard
        ├── authConfig.js                    # Keycloak PKCE client configuration
        ├── Theme.jsx                        # Design tokens, global typography & keyframes
        ├── services/api.js                  # Axios client with Authorization & X-User-ID interceptor
        ├── store/                           # Redux Toolkit store & authSlice
        └── components/
            ├── ActvityForm.jsx              # Workout logging form
            ├── ActivityList.jsx             # Activities feed and summary cards
            ├── ActivityDetail.jsx           # AI recommendations & breakdown screen
            └── UserProfileMenu.jsx          # Header avatar popover showing user profile
```

---

## 5. Microservice Catalog & Port Mappings

| Service Name | Internal Folder | Port | Responsibilities | Data Store |
|---|---|---|---|---|
| **Config Server** | `configserver/configserver` | `8888` | Serves centralized `.yml` configs | Native classpath |
| **Eureka Server** | `eureka/eureka` | `8761` | Service discovery and registration | In-memory |
| **API Gateway** | `gateway/gateway` | `8086` | Routing, CORS, JWT Auth, User Sync | Stateless |
| **User Service** | `userservice/userservice` | `8084` | User profiles, registration, validation | PostgreSQL (`fitnessapp`) |
| **Activity Service** | `activityservice/activityservice` | `8083` | Activity CRUD, event publishing | MongoDB (`test` / `activitydb`) |
| **AI Service** | `aiservice/aiservice` | `8087` | Kafka event consumption, Gemini AI | MongoDB (`test`) |
| **Kafka Broker** | `kafka` | `9092` / `9093` | Messaging backbone (`activity-events`) | Local storage (KRaft) |
| **Keycloak Auth** | External container | `8080` | Identity provider, token issuing | PostgreSQL / Keycloak H2 |
| **Fitness Frontend** | `fitness-frontend` | `5173` | React 19 Client SPA | Browser `localStorage` |

---

## 6. Key Interactions & Communication Flows

### A. Keycloak Authentication & User Synchronization
1. The user visits the frontend and authenticates against Keycloak (`fitness-app` realm).
2. Keycloak returns an access token and ID token containing user claims (`sub`, `email`, `given_name`, `family_name`).
3. When the frontend sends any API request through the API Gateway (`http://localhost:8086/api/...`), `KeycloakUserSyncFilter` intercepts it:
   - Reads `Authorization: Bearer <token>` and `X-User-ID`.
   - Parses JWT claims using `com.nimbusds.jwt.SignedJWT`.
   - Calls `UserService.validateUser(userId)` (`GET /api/v1/{userId}/validate`).
   - If user is not yet present in the PostgreSQL database, automatically triggers `POST /api/v1/register` to persist the profile.
   - Injects/mutates the header `X-User-ID: <sub-id>` into the forwarded request.

### B. Activity Tracking & AI Recommendation Pipeline
1. **User Action:** User logs a workout via `ActvityForm.jsx` on the frontend.
2. **Frontend Dispatch:** Axios sends `POST /api/activities` to API Gateway with headers:
   - `Authorization: Bearer <token>`
   - `X-User-ID: <userId>`
3. **Activity Service Execution:**
   - Validates user with `UserValidationService.validateUser(userId)` via WebClient (`http://USER-SERVICE/api/v1/{userId}/validate`).
   - Stores the activity document in MongoDB (`aiactivityfitness` collection).
   - Publishes the full `Activity` payload to Kafka topic `activity-events` keyed by `userId`.
4. **AI Service Processing:**
   - `ActivityMessageListener` consumes `Activity` from Kafka topic `activity-events`.
   - Formats a comprehensive system prompt describing workout duration, type, calories burned, and additional metrics.
   - Sends prompt to `GeminiService` targeting Google Gemini (`gemini-3.6-flash`).
   - Parses the returned structured JSON into:
     - `analysis` (`overall`, `pace`, `heartRate`, `caloriesBurned`)
     - `improvements` list
     - `suggestions` list
     - `safety` guidelines
   - Saves the resulting `Recommendation` entity in MongoDB (`airecommendationfitness` collection).
5. **Frontend Feedback:** When the user navigates to an activity or views `ActivityDetail.jsx`, the frontend queries `GET /api/recommendations/activity/{id}` to fetch the AI insights.

---

## 7. API Endpoints Specification

### API Gateway Routes (`http://localhost:8086`)

All requests through the Gateway require:
- `Authorization: Bearer <keycloak_jwt_token>`
- Optional: `X-User-ID: <keycloak_sub_id>` (injected automatically by Gateway if omitted)

#### 1. User Service (`/api/v1/**` -> `http://USER-SERVICE:8084`)
- `POST /api/v1/register`: Register a new user profile.
- `GET /api/v1/{userId}`: Retrieve user profile by database UUID.
- `GET /api/v1/{userId}/validate`: Check if user exists by Keycloak ID (returns boolean `true` / `false`).
- `GET /api/v1/profile`: Retrieve user profile for the authenticated user using `X-User-ID` header.

#### 2. Activity Service (`/api/activities/**` -> `http://ACTIVITY-SERVICE:8083`)
- `POST /api/activities`: Record workout.
- `GET /api/activities`: Get all activities for current user (`X-User-ID`).

#### 3. AI Service (`/api/recommendations/**` -> `http://AI-SERVICE:8087`)
- `GET /api/recommendations/user/{userId}`: Get all recommendations generated for a user.
- `GET /api/recommendations/activity/{activityId}`: Get specific recommendation for an activity.

---

## 8. Configuration & Environment Variables

### Configuration Hierarchy
Each Spring microservice specifies:
```yaml
spring:
  application:
    name: <service-name>
  config:
    import: optional:configserver:http://localhost:8888  # Local
    # optional:configserver:http://configserver.fitness.internal:8888 # Production
```
All business configurations live in the `configserver/configserver/src/main/resources/` directory.

### Key Environment Variables (Production & Containerized)

| Variable | Target Service | Purpose | Example / Default |
|---|---|---|---|
| `DB_HOST` | `user-service` | PostgreSQL host | `postgres.fitness.internal` |
| `DB_USERNAME` | `user-service` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | `user-service` | PostgreSQL password | `secret` |
| `MONGODB_URI` | `activity-service`, `ai-service` | MongoDB Connection URI | `mongodb://mongo.fitness.internal:27017` |
| `GEMINI_URL` | `ai-service` | Google Gemini API Endpoint | `https://generativelanguage.googleapis.com/v1beta/interactions` |
| `GEMINI_KEY` | `ai-service` | Google Gemini API Secret Key | `AIzaSy...` |
| `AWS_REGION` | GitHub Actions / Deploy | Target AWS Deployment Region | `us-east-2` |
| `ECR_REGISTRY` | GitHub Actions / Deploy | ECR Container Registry | `341860777759.dkr.ecr.us-east-2.amazonaws.com` |

---

## 9. Local Development & Run Guide

### Quick Start via Docker Compose:
```bash
# 1. Start backing infrastructure:
docker compose up -d

# 2. Start services in order:
(cd configserver/configserver && ./mvnw spring-boot:run) &
(cd eureka/eureka && ./mvnw spring-boot:run) &
(cd userservice/userservice && ./mvnw spring-boot:run) &
(cd activityservice/activityservice && ./mvnw spring-boot:run) &
(cd aiservice/aiservice && export GEMINI_KEY="AIzaSy..." && ./mvnw spring-boot:run) &
(cd gateway/gateway && ./mvnw spring-boot:run) &
(cd fitness-frontend && npm run dev) &
```

Default Test Account in Keycloak:
- **Username:** `testuser`
- **Password:** `password123`
- **Email:** `testuser@example.com`

---

## 10. CI/CD & AWS EC2 Docker Deployment Pipeline

The project includes an end-to-end automated deployment pipeline defined in `.github/workflows/deploy.yml`.

### Deployment Pipeline Workflow:
1. **Trigger:** Automatically runs on `git push` to the `main` branch (or manual trigger via GitHub Actions UI).
2. **CI Stage (Build & Package):**
   - Sets up **Java 21 (Temurin)** and **Node.js 20**.
   - Builds all 6 backend Spring Boot microservices with Maven (`mvn clean package -DskipTests`).
   - Builds the React SPA with Vite (`npm ci && npm run build` into `dist/`).
   - Builds Docker images for all services:
     - `fitness-configserver`
     - `fitness-eureka`
     - `fitness-userservice`
     - `fitness-activityservice`
     - `fitness-aiservice`
     - `fitness-gateway`
     - `fitness-frontend` (Nginx with SPA router support)
   - Tags and publishes images to **GitHub Container Registry (`ghcr.io`)** using the repository commit SHA and `:latest`.
3. **CD Stage (AWS EC2 Deployment):**
   - Connects securely to the AWS EC2 instance via SSH.
   - Syncs `docker-compose.prod.yml`, `keycloak/realm-export.json`, and dynamic environment parameters.
   - Executes `docker compose -f docker-compose.prod.yml pull` to fetch the newly built images.
   - Restarts all containers seamlessly: `docker compose -f docker-compose.prod.yml up -d --remove-orphans`.
   - Cleans dangling images via `docker image prune -f` and outputs container statuses.

---

### One-Time AWS EC2 Setup Instructions

1. **Launch an EC2 Instance:**
   - **OS:** Ubuntu 24.04 LTS or 22.04 LTS
   - **Instance Type:** `t3.large` or `t3.xlarge` (Recommended: 8GB RAM, 2 vCPUs)
   - **Storage:** 30–40 GB gp3 SSD
   - **Security Group Inbound Rules:**
     - Port `22` (SSH)
     - Port `80` (Frontend / Web)
     - Port `8080` (Keycloak)
     - Port `8086` (API Gateway)

2. **Install Docker & Docker Compose on the EC2 Instance:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```

3. **Configure GitHub Repository Secrets:**
   Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** and add:
   - `EC2_HOST`: The Public IP or Public DNS of your EC2 instance (e.g. `54.123.45.67`)
   - `EC2_USER`: `ubuntu`
   - `EC2_SSH_KEY`: The entire content of your AWS `.pem` private key file
   - `GEMINI_KEY`: Your Google Gemini API Key
   - `DB_PASSWORD`: (Optional) PostgreSQL database password (defaults to `rohith`)
   - `GHCR_TOKEN`: (Optional) GitHub Personal Access Token with `read:packages` if the packages are private.

