# System Architecture

## Overview

This is a real-time multiplayer quiz application with a participant-facing view and an admin control panel, all synchronized through Firebase Firestore.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PARTICIPANTS                            │
│  (Public Route: /)                                              │
│                                                                 │
│  1. Enter Name → 2. Wait in Lobby → 3. See Question            │
│  4. Submit Answer → 5. Wait for Check → 6. See Score           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Real-time Sync
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE FIRESTORE                          │
│                    (Real-time Database)                         │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  game_state    │  │   questions    │  │     users      │  │
│  │  - index       │  │   - text       │  │   - name       │  │
│  │  - status      │  │   - mediaType  │  │   - score      │  │
│  └────────────────┘  │   - mediaUrl   │  └────────────────┘  │
│                      │   - answer     │                       │
│                      └────────────────┘  ┌────────────────┐  │
│                                          │    answers     │  │
│                                          │  - userId      │  │
│                                          │  - questionId  │  │
│                                          │  - answerText  │  │
│                                          │  - isCorrect   │  │
│                                          └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Real-time Sync
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                            ADMIN                                │
│  (Protected Route: /admin - Requires Firebase Auth)            │
│                                                                 │
│  1. Login → 2. View Questions → 3. Start Question              │
│  4. See Incoming Answers → 5. Mark Correct/Incorrect           │
│  6. Show Results → 7. Next Question                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Participant Flow

```
User Action              →  Firestore Update        →  Real-time Response
─────────────────────────────────────────────────────────────────────
Enter Name              →  Create user doc         →  User ID assigned
Wait                    →  Listen to game_state    →  Question appears when admin starts
See Question            →  Read questions          →  Display with media
Submit Answer           →  Create answer doc       →  "Waiting for check" message
Admin Marks Answer      →  Update answer.isCorrect →  Score updates
                           Update user.score
Admin Shows Results     →  Update game_state       →  Results screen appears
```

### Admin Flow

```
Admin Action            →  Firestore Update        →  Real-time Effect
─────────────────────────────────────────────────────────────────────
Login                   →  Firebase Auth           →  Access granted
Start Question X        →  Update game_state       →  All participants see question
View Answers            →  Listen to answers       →  Real-time list of submissions
Mark Correct            →  Update answer doc       →  User score increments
                           Update user doc
Show Results            →  Update game_state       →  Participants see results
Next Question           →  Update game_state       →  Cycle repeats
```

## Component Hierarchy

```
App.jsx (Router)
│
├─ ParticipantView.jsx (/)
│  ├─ Name Entry Form
│  ├─ Lobby Screen
│  ├─ QuestionCard.jsx
│  │  └─ MediaDisplay.jsx (text/image/video/audio)
│  ├─ Answer Submission Form
│  └─ Results/ScoreBoard.jsx
│
└─ Admin Routes (/admin/*)
   ├─ AdminLogin.jsx (/admin/login)
   └─ ProtectedRoute.jsx
      └─ AdminDashboard.jsx (/admin)
         ├─ Question List
         ├─ Game Controls
         ├─ AnswerList.jsx
         │  └─ Individual answer items with Mark buttons
         └─ ScoreBoard.jsx
```

## Real-time Listeners

### Participant View
- `game_state` → Update UI based on status changes
- `questions` → Display current question
- `users/{currentUserId}` → Update own score
- `answers` → (Optional) Track own answer status

### Admin Dashboard
- `game_state` → Show current quiz status
- `questions` → List all questions
- `users` → Display all participants and scores
- `answers` → Show incoming answers for current question

## Security Model

```
Collection    │ Read           │ Create         │ Update         │ Delete
──────────────┼────────────────┼────────────────┼────────────────┼─────────
game_state    │ Public         │ Admin only     │ Admin only     │ Admin only
questions     │ Public         │ Admin only     │ Admin only     │ Admin only
users         │ Public         │ Public         │ Admin or Self  │ Admin only
answers       │ Public         │ Public         │ Admin only     │ Admin only
```

## State Management

### Participant State
- `userName` - Locally stored participant name
- `userId` - Firestore document ID
- `currentQuestion` - Synced from Firestore
- `gameStatus` - Synced from Firestore
- `userScore` - Synced from Firestore

### Admin State
- `isAuthenticated` - From Firebase Auth
- `questions` - Synced from Firestore
- `currentQuestionIndex` - Synced from Firestore
- `answers` - Synced from Firestore (filtered by current question)
- `users` - Synced from Firestore (all participants)

## Media Support Architecture

```
MediaDisplay Component
│
├─ mediaType === 'text'
│  └─ Render text in styled div
│
├─ mediaType === 'image'
│  └─ <img src={mediaUrl} /> or Placeholder
│
├─ mediaType === 'video'
│  └─ <video src={mediaUrl} /> or Placeholder
│
└─ mediaType === 'audio'
   └─ <audio src={mediaUrl} /> or Placeholder
```

## Deployment Architecture

```
┌─────────────────────────────────────┐
│          Users (Browsers)           │
└─────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────┐
│         Vercel CDN (Free)           │
│  - Serves React SPA                 │
│  - Automatic HTTPS                  │
│  - Global CDN                       │
└─────────────────────────────────────┘
                 │
                 │ SDK Calls
                 ▼
┌─────────────────────────────────────┐
│      Firebase (Free Tier)           │
│  ┌─────────────────────────────┐   │
│  │ Firebase Auth               │   │
│  │ - Admin login only          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Firestore Database          │   │
│  │ - Real-time sync            │   │
│  │ - NoSQL collections         │   │
│  │ - Security rules enforced   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Performance Considerations

### Optimization Strategies
1. **Firestore Queries**
   - Query only current question's answers
   - Limit real-time listeners to necessary collections
   - Use Firestore indexing for complex queries

2. **React Optimization**
   - Use React.memo for expensive components
   - Implement proper key props for lists
   - Lazy load admin routes

3. **Media Handling**
   - Lazy load images
   - Use appropriate video/audio controls
   - Implement loading states

### Cost Optimization
- **Read Operations**: Minimize unnecessary reads
- **Write Operations**: Batch updates when possible
- **Realtime Listeners**: Unsubscribe when components unmount
- **Free Tier Limits**:
  - Firestore: 50K reads/day, 20K writes/day
  - Vercel: 100GB bandwidth/month

## Error Handling

```
Layer              │ Error Handling Strategy
───────────────────┼────────────────────────────────────────
Firestore Ops      │ Try-catch blocks, display user-friendly messages
Authentication     │ Validate credentials, show login errors
Real-time Sync     │ Handle connection drops, show "reconnecting" state
Form Validation    │ Client-side validation before submission
Network Errors     │ Retry logic, offline indicators
Missing Data       │ Default values, loading states
```

## Scalability Notes

**Current Architecture Supports**:
- 20-50 concurrent participants (free tier)
- Real-time synchronization across all clients
- Question database of any size (within Firestore limits)

**To Scale Beyond Free Tier**:
- Upgrade Firebase plan (Blaze - pay as you go)
- Implement pagination for large datasets
- Add caching layers
- Consider Firebase Hosting for static assets
- Implement connection pooling for high traffic

---

This architecture ensures a robust, scalable, and cost-effective multiplayer quiz application with real-time capabilities.
