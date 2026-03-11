# Real-Time Multiplayer Quiz App - Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Google/Firebase account (free tier)

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "multiplayer-quiz")
4. Follow the setup wizard (you can disable Google Analytics for this project)

### 1.2 Enable Firestore Database
1. In your Firebase project, go to **Build > Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Choose a location (select closest to your users)

### 1.3 Enable Authentication
1. Go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Create an admin user:
   - Go to the "Users" tab
   - Click "Add user"
   - Enter admin email and password
   - Save the credentials securely

### 1.4 Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Quiz App")
5. Copy the `firebaseConfig` object

### 1.5 Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Firebase configuration values in `.env`

### 1.6 Update Firebase Config File
1. Open `src/config/firebase.js`
2. Replace the placeholder values with your actual Firebase config, OR
3. Update it to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

### 1.7 Deploy Firestore Rules
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase:
   ```bash
   firebase login
   ```
3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Accept the default `firestore.rules` file
   - Accept the default `firestore.indexes.json` file
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 2: Initial Data Setup (Optional)

You can add sample questions directly from the Admin Dashboard after deployment, or manually add them to Firestore:

1. Go to Firestore Database in Firebase Console
2. Create a collection called `questions`
3. Add documents with this structure:
   ```
   {
     id: "q1",
     text: "What is the capital of France?",
     mediaType: "text",
     mediaUrl: "",
     correctAnswer: "Paris"
   }
   ```

4. Create a document in `game_state` collection with ID `current`:
   ```
   {
     currentQuestionIndex: 0,
     status: "waiting"
   }
   ```

## Step 3: Running Locally

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173/` to see the participant view.
Visit `http://localhost:5173/admin` for the admin dashboard.

## Step 4: Deployment to Vercel

### 4.1 Build the Project
```bash
npm run build
```

### 4.2 Deploy to Vercel
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Follow the prompts:
   - Link to existing project or create new
   - Configure project settings
   - Deploy

### 4.3 Configure Environment Variables on Vercel
1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings > Environment Variables**
3. Add all variables from your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Redeploy the project

### 4.4 Update Firebase Authorized Domains
1. Go to Firebase Console > Authentication > Settings
2. Scroll to "Authorized domains"
3. Add your Vercel domain (e.g., `your-app.vercel.app`)

## Security Notes

- **Never commit `.env` file to version control**
- The `.env` file is already in `.gitignore`
- For production, always use Vercel environment variables
- Keep your admin credentials secure
- Firestore rules ensure only authenticated admins can modify critical data

## Troubleshooting

### Issue: "Permission denied" errors in Firestore
- Solution: Make sure you've deployed the `firestore.rules` file

### Issue: Admin login not working
- Solution: Verify you've created an admin user in Firebase Authentication
- Check that Email/Password provider is enabled

### Issue: Real-time updates not working
- Solution: Check Firebase project quotas (free tier has limits)
- Verify Firestore rules allow reading

## Cost Estimation (Free Tier Limits)

Firebase Spark Plan (Free):
- Firestore: 50K reads/day, 20K writes/day
- Authentication: Unlimited
- Hosting: 10GB storage, 360MB/day transfer

Vercel Hobby Plan (Free):
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

This should be sufficient for small to medium-sized quiz sessions.
