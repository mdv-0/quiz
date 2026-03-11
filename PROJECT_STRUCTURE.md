# Project Directory Structure

```
quiz/
├── public/                          # Static assets
├── src/
│   ├── components/                  # Reusable React components
│   │   ├── MediaDisplay.jsx        # Component to display different media types (text, image, video, audio)
│   │   ├── QuestionCard.jsx        # Component to display a question
│   │   ├── AnswerList.jsx          # Component for admin to see and mark answers
│   │   ├── ScoreBoard.jsx          # Component to display user scores
│   │   └── ProtectedRoute.jsx      # HOC for protecting admin routes
│   │
│   ├── pages/                       # Page components
│   │   ├── ParticipantView.jsx     # Main participant page (/)
│   │   ├── AdminDashboard.jsx      # Admin control panel (/admin)
│   │   └── AdminLogin.jsx          # Admin login page (/admin/login)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useGameState.js         # Hook for subscribing to game state
│   │   ├── useQuestions.js         # Hook for fetching questions
│   │   ├── useUsers.js             # Hook for managing users
│   │   └── useAnswers.js           # Hook for managing answers
│   │
│   ├── utils/                       # Utility functions
│   │   └── firestoreHelpers.js     # Helper functions for Firestore operations
│   │
│   ├── config/                      # Configuration files
│   │   └── firebase.js             # Firebase initialization and exports
│   │
│   ├── App.jsx                      # Main App component with routing
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles (Tailwind imports)
│
├── .env.example                     # Example environment variables
├── .env                             # Your actual environment variables (not in git)
├── .gitignore                       # Git ignore file
├── firestore.rules                  # Firestore security rules
├── vercel.json                      # Vercel deployment configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── vite.config.js                   # Vite configuration
├── package.json                     # Node dependencies
├── SETUP_GUIDE.md                   # Detailed setup instructions
├── PROJECT_STRUCTURE.md             # This file
└── README.md                        # Project overview
```

## Component Descriptions

### Pages

#### ParticipantView.jsx (/)
- Entry form for participant name
- Lobby screen while waiting
- Question display with media support
- Answer submission form
- Results display with updated score

#### AdminDashboard.jsx (/admin)
- List of all questions
- Control panel to navigate questions
- Real-time view of submitted answers
- Interface to mark answers as correct/incorrect
- Button to show results to participants
- Current game status display

#### AdminLogin.jsx (/admin/login)
- Email/password login form
- Firebase authentication
- Redirect to dashboard on success

### Components

#### MediaDisplay.jsx
- Props: `mediaType`, `mediaUrl`, `text`
- Renders appropriate component based on media type
- Placeholder implementations for image/video/audio

#### QuestionCard.jsx
- Props: `question`
- Displays question text and media
- Used by both participant and admin views

#### AnswerList.jsx
- Props: `answers`, `onMarkAnswer`
- Shows all submitted answers for current question
- Buttons to mark each answer as correct/incorrect
- Admin-only component

#### ScoreBoard.jsx
- Props: `users`
- Displays sorted list of participants with scores
- Can be used in results view

#### ProtectedRoute.jsx
- HOC that checks authentication
- Redirects to login if not authenticated
- Wraps admin routes

## Database Collections

### game_state (single document with ID: "current")
```javascript
{
  currentQuestionIndex: 0,
  status: 'waiting' | 'question_active' | 'showing_results'
}
```

### questions
```javascript
{
  id: 'q1',
  text: 'Question text here',
  mediaType: 'text' | 'image' | 'video' | 'audio',
  mediaUrl: 'https://...' or '',
  correctAnswer: 'Expected answer for reference'
}
```

### users
```javascript
{
  id: 'auto-generated',
  name: 'Participant Name',
  score: 0
}
```

### answers
```javascript
{
  id: 'auto-generated',
  userId: 'user_id',
  questionId: 'question_id',
  answerText: 'User submitted answer',
  isCorrect: true | false | null  // null = not checked yet
}
```

## Key Features

### Real-time Synchronization
- All participants see updates when admin changes game state
- Admin sees answers as they're submitted
- Scores update in real-time

### Media Support
- Framework for text, image, video, and audio questions
- Placeholder components ready for actual media implementation

### Security
- Firebase Auth for admin access
- Firestore rules prevent unauthorized writes
- Admin-only operations protected

### Deployment Ready
- Environment variable configuration
- Vercel configuration included
- Build optimization with Vite

## Next Steps (After Confirmation)

1. Create all React components
2. Implement custom hooks for Firestore operations
3. Set up routing with React Router
4. Implement authentication flow
5. Add participant and admin functionality
6. Test real-time synchronization
7. Add error handling and loading states
8. Polish UI with Tailwind CSS
