# Real-Time Multiplayer Quiz Application

A free-to-host, real-time multiplayer quiz application built with React, Firebase, and deployed on Vercel.

## 🎯 Features

- **Real-time Synchronization**: All participants see live updates as the quiz progresses
- **Admin Control Panel**: Full control over quiz flow, question navigation, and answer validation
- **Media Support**: Framework for text, image, video, and audio questions
- **Score Tracking**: Automatic score calculation and real-time leaderboard
- **Secure Authentication**: Firebase Auth for admin access
- **Free Hosting**: Completely free to host on Firebase (Spark plan) and Vercel (Hobby plan)

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase Firestore (real-time NoSQL database)
- **Authentication**: Firebase Auth
- **Routing**: React Router DOM
- **Hosting**: Vercel (frontend) + Firebase (backend)

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Firebase account (free)
- Vercel account (free, optional for deployment)

### Installation

1. **Clone the repository** (or you're already here!)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Follow the detailed steps in [SETUP_GUIDE.md](./SETUP_GUIDE.md)
   - Create a Firebase project
   - Enable Firestore and Authentication
   - Copy configuration values

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

5. **Deploy Firestore rules**:
   ```bash
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```

6. **Run locally**:
   ```bash
   npm run dev
   ```

7. **Access the app**:
   - Participant view: `http://localhost:5173/`
   - Admin dashboard: `http://localhost:5173/admin`

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed information about the codebase organization.

```
quiz/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components (Participant, Admin)
│   ├── hooks/           # Custom hooks for Firestore
│   ├── utils/           # Helper functions
│   └── config/          # Firebase configuration
├── firestore.rules      # Database security rules
├── vercel.json          # Vercel deployment config
└── SETUP_GUIDE.md       # Detailed setup instructions
```

## 🎮 How It Works

### Participant Flow
1. Enter name to join
2. Wait in lobby for admin to start
3. See question (with optional media)
4. Submit text answer
5. Wait for admin to validate
6. View updated score

### Admin Flow
1. Login with Firebase Auth
2. Select question to display
3. See incoming answers in real-time
4. Mark each answer as correct/incorrect
5. Trigger results display
6. Move to next question

## 🔒 Security

- Firestore rules ensure data integrity
- Admin routes protected by Firebase Auth
- Environment variables for sensitive configuration
- HTTPS enforced on Vercel deployment

## 📊 Database Schema

### Collections

**game_state**: Controls quiz flow
- `currentQuestionIndex`: Current question number
- `status`: 'waiting' | 'question_active' | 'showing_results'

**questions**: Quiz questions
- `text`: Question text
- `mediaType`: 'text' | 'image' | 'video' | 'audio'
- `mediaUrl`: URL to media file (or empty)
- `correctAnswer`: Reference answer for admin

**users**: Participants
- `name`: Participant name
- `score`: Current score

**answers**: Submitted answers
- `userId`: Reference to user
- `questionId`: Reference to question
- `answerText`: User's answer
- `isCorrect`: true | false | null (null = not checked)

## 🚀 Deployment

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

**Quick deploy to Vercel**:
```bash
npm install -g vercel
vercel
```

Don't forget to:
1. Add environment variables in Vercel dashboard
2. Add Vercel domain to Firebase authorized domains

## 💰 Cost

**Completely FREE** with these plans:
- Firebase Spark Plan: 50K reads/day, 20K writes/day
- Vercel Hobby Plan: 100GB bandwidth/month

Sufficient for most quiz sessions!

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

## 📧 Support

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

Built with ❤️ using React, Firebase, and Tailwind CSS
