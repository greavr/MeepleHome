# Meeple Home 🎲

Meeple Home is a comprehensive board game management system designed for households. It allows you to track your game collection (with BGG integration), plan game nights, vote on what to play, record scores, and interact with "MeepleBot" for game recommendations and rules clarification.

## Features

- **BGG Integration**: Import your collection directly from BoardGameGeek.
- **Game Nights**: Schedule sessions, vote on games, and record results.
- **Resource Library**: Manage "How to Play" videos, rules PDFs, and reviews.
- **AI Assistant**: MeepleBot is powered by Gemini to help with rules and suggestions.
- **Real-time Updates**: Powered by Firebase Firestore.

---

## 🚀 Local Development Guide

To run Meeple Home on your local machine, follow these steps:

### Prerequisites

- **Node.js**: Version 18 or higher.
- **npm**: Standard package manager.
- **Firebase Project**: You'll need a Firebase project with Firestore and Auth (Google Login) enabled.

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd meeple-home
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```
   *Note: For local development, ensure your Firebase project allows `localhost:3000` in the Authorized Domains list.*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## ☁️ Deployment Guide

### Option 1: Google Cloud Run (Recommended)

This app is designed to be containerized and deployed to Cloud Run.

1. **Build the container**:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/meeple-home
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy meeple-home \
     --image gcr.io/[PROJECT_ID]/meeple-home \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_key"
   ```

### Option 2: Firebase Hosting

Since this is a Vite SPA, you can also deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

---

## 🛠️ Infrastructure as Code (Terraform)

Below is a sample Terraform configuration to provision the necessary Google Cloud resources.

```hcl
# main.tf

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required services
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com"
  ])
  service = each.key
}

# Provision Firestore in Native Mode
resource "google_firestore_database" "database" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  depends_on = [google_project_service.services]
}

# Deploy Cloud Run Service
resource "google_cloud_run_service" "meeple_home" {
  name     = "meeple-home"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/meeple-home:latest"
        env {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.services]
}

# Allow public access to Cloud Run
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.meeple_home.location
  project  = google_cloud_run_service.meeple_home.project
  service  = google_cloud_run_service.meeple_home.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Variables
variable "project_id" { type = string }
variable "region"     { type = string; default = "us-central1" }
variable "gemini_api_key" { type = string; sensitive = true }
```

---

## 📄 License

MIT License - feel free to use and modify for your own board game group!
