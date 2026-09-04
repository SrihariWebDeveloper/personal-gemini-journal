# Personal Gemini Journal

A production-grade, full-stack personal AI journaling web application built with React, TypeScript, Express, Firebase Authentication, Cloud Firestore, Google Cloud Secret Manager, and the Gemini API.

---

## Architecture & Security Model

```
React Frontend (Vite + Tailwind CSS)
    ↓  (HTTP with Authorization: Bearer <Firebase ID Token>)
Secure Express Backend (Node.js / tsx)
    ↓  (Token Verification via firebase-admin)
Identity Extraction (req.user.uid)
    ↓  (Secret Resolution via Google Cloud Secret Manager)
Gemini AI API (Resilient Fallback Ladder: gemini-3.6-flash → gemini-3.1-flash-lite → gemini-flash-latest → gemini-3.7-flash)
    ↓  (User-Isolated Subcollections: /users/{uid}/journalEntries/{entryId})
Cloud Firestore (Enforced by strict owner-bound firestore.rules)
```

---

## 1. Environment & Prerequisites

1. **Google Cloud Project**: With billing enabled.
2. **Google Cloud APIs to Enable**:
   ```bash
   gcloud services enable run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com
   ```
3. **Google Cloud SDK / gcloud CLI**: Installed and authenticated (`gcloud auth login`).
4. **Node.js**: Version 18+ and npm installed.

---

## 2. Secret Management Setup (Google Cloud Secret Manager)

To eliminate hardcoded credentials and prevent client-side credential exposure:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key as the latest version
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

For local development, copy `.env.example` to `.env` and provide your development fallback variables:
```bash
cp .env.example .env
```

---

## 3. Database Security Configuration (Cloud Firestore)

All journal data is strictly bound to the authenticated user's ID under `/users/{uid}/journalEntries/{entryId}`.

Deploy the owner-bound security rules to ensure complete cross-tenant data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{uid}/journalEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: false;
    }
  }
}
```

Deploying Firestore rules via Firebase CLI or AI Studio tool:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

To containerize and deploy the application to Google Cloud Run:

```bash
# 1. Submit the container image build
gcloud builds submit --tag gcr.io/$PROJECT_ID/personal-gemini-journal

# 2. Deploy to Cloud Run
gcloud run deploy personal-gemini-journal \
  --image gcr.io/$PROJECT_ID/personal-gemini-journal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,NODE_ENV=production"
```

---

## 5. Required Campaign Verification Labeling

To register your deployed service for automated challenge verification, apply the mandatory campaign label:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Walkthrough & Test Guide

Every user interaction has a defined test verification path:

### Test Case 1: Authentication State & Federated Google Sign-In
- **Action**: Click "Continue with Google" on the login screen.
- **Expected Outcome**: Firebase popup authenticates user, extracts ID token, and directs to Dashboard with authenticated status badge.
- **Security Check**: Unauthenticated requests to `/api/journal/*` return HTTP 401 Unauthorized.

### Test Case 2: Multi-Turn Conversational Journaling with Gemini
- **Action**: Navigate to "New Journal", type a reflective thought (e.g., "I felt overwhelmed today with deadlines"), and submit.
- **Expected Outcome**: Message appears in user bubble; typing indicator shows; Gemini responds empathetically within 1-3 concise paragraphs.
- **Resilience Check**: If primary model (`gemini-3.6-flash`) experiences throttling, the system seamlessly cascades to `gemini-3.1-flash-lite` or fallback models without user disruption.

### Test Case 3: Session End & Automated Reflection Synthesis
- **Action**: Click "End & Save Session".
- **Expected Outcome**: Modal opens, triggers `/api/journal/analyze`, and populates summary, mood tag, topics, insights, and next actions.

### Test Case 4: Zero-Crash Database Persistence & Undefined-Stripping
- **Action**: Edit session title in modal and click "Save to Journal".
- **Expected Outcome**: Entry payload is sanitized (all undefined keys stripped) and committed to `/users/{uid}/journalEntries/{entryId}`. On success, redirects to the Journal Detail view.
- **Error Recovery**: If network drops or database write fails, a persistent retry banner appears with "Retry Save"; the user input and transcript buffer are never lost.

### Test Case 5: Journal Archive Search, Filter & Topic Tagging
- **Action**: Open "History", search keywords, filter by mood or click topic chips.
- **Expected Outcome**: List instantly filters matching entries; clicking "Reset Filters" restores full chronological list.

### Test Case 6: Data Portability & Isolation Verification
- **Action**: Open "Settings", click "Export Journal Data (JSON)".
- **Expected Outcome**: Browser downloads verified JSON export of the user's isolated entries only. User UID is displayed cryptographically for verification.

---

## 7. Automated Security Test Suite

Run the automated test suite locally to verify input limits, role bounds, and tenant isolation:
```bash
npm test
```
