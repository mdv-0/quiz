# 🚀 Quick Reference Card

## Immediate Action Required

### 1️⃣ Add Data to Firestore (REQUIRED)

**Go to Firebase Console → Firestore Database:**

#### Create `game_state` collection:
```
Collection: game_state
Document ID: current
Fields:
  - currentQuestionIndex: 0 (number)
  - status: "waiting" (string)
```

#### Create `questions` collection:
```
Collection: questions
Add 5 documents with these fields for each:

Document 1:
  - id: "q1" (string)
  - text: "What is the capital of France?" (string)
  - mediaType: "text" (string)
  - mediaUrl: "" (string, empty)
  - correctAnswer: "Paris" (string)

Document 2:
  - id: "q2"
  - text: "What is 5 + 7?"
  - mediaType: "text"
  - mediaUrl: ""
  - correctAnswer: "12"

Document 3:
  - id: "q3"
  - text: "Who painted the Mona Lisa?"
  - mediaType: "text"
  - mediaUrl: ""
  - correctAnswer: "Leonardo da Vinci"

Document 4:
  - id: "q4"
  - text: "What is the largest planet in our solar system?"
  - mediaType: "text"
  - mediaUrl: ""
  - correctAnswer: "Jupiter"

Document 5:
  - id: "q5"
  - text: "In which year did World War II end?"
  - mediaType: "text"
  - mediaUrl: ""
  - correctAnswer: "1945"
```

### 2️⃣ Deploy Firestore Rules

```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

---

## 🌐 URLs

| Route | URL | Purpose |
|-------|-----|---------|
| Participant | http://localhost:5173/ | Join quiz, answer questions |
| Admin Login | http://localhost:5173/admin/login | Admin authentication |
| Admin Dashboard | http://localhost:5173/admin | Control panel |

---

## 🔑 Admin Credentials

**Your Firebase Admin User:**
- Email: [The one you created in Firebase Auth]
- Password: [The one you set]

---

## 📱 Testing Workflow

### Quick Test (5 minutes)

1. **Open 3 browser windows:**
   - Window 1: http://localhost:5173/ (Participant 1)
   - Window 2: http://localhost:5173/ (Participant 2)
   - Window 3: http://localhost:5173/admin (Admin)

2. **Participants join:**
   - Window 1: Enter "Alice" → Join
   - Window 2: Enter "Bob" → Join
   - Both see waiting screen

3. **Admin starts quiz:**
   - Window 3: Login → Click "Start" on Question 1
   - Windows 1 & 2 instantly show question

4. **Participants answer:**
   - Alice: Types "Paris" → Submit
   - Bob: Types "London" → Submit
   - Admin sees both answers in real-time

5. **Admin marks answers:**
   - Mark Alice as ✓ Correct
   - Mark Bob as ✗ Incorrect
   - Scores update: Alice=1, Bob=0

6. **Admin shows results:**
   - Click "📊 Show Results"
   - All windows show scoreboard

7. **Continue:**
   - Click "➡️ Next Question"
   - Repeat for more questions

---

## 🎯 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy to Vercel
vercel
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Permission denied | Deploy Firestore rules |
| Can't login | Check admin user in Firebase Auth |
| No questions shown | Add questions to Firestore |
| No real-time updates | Deploy Firestore rules |
| Build errors | Check all imports are correct |

---

## 📂 Key Files

| File | What to Edit |
|------|--------------|
| `src/pages/ParticipantView.jsx` | Participant UI and logic |
| `src/pages/AdminDashboard.jsx` | Admin UI and controls |
| `src/components/MediaDisplay.jsx` | Question display styling |
| `src/components/ScoreBoard.jsx` | Scoreboard appearance |
| `firestore.rules` | Database security |
| `.env` | Firebase credentials |

---

## 🎨 Customization Quick Wins

### Change Colors
Search for `indigo` in components and replace with your color:
- `bg-indigo-600` → `bg-purple-600`
- `text-indigo-600` → `text-purple-600`

### Add Timer
In `ParticipantView.jsx`, add a countdown using `useEffect`

### Change Scoring
In `hooks/useUsers.js`, modify `incrementUserScore` function

### Add More Questions
Go to Firestore Console → questions collection → Add document

---

## 📊 Firebase Quotas (Free Tier)

| Resource | Limit | Notes |
|----------|-------|-------|
| Firestore Reads | 50K/day | Should be enough for 100+ participants |
| Firestore Writes | 20K/day | Questions + answers + scores |
| Authentication | Unlimited | Free forever |
| Storage | 1 GB | For media files (images/videos) |

---

## ✅ Success Checklist

- ✅ Server running at localhost:5173
- ⏳ Data added to Firestore
- ⏳ Firestore rules deployed
- ⏳ Tested participant flow
- ⏳ Tested admin flow
- ⏳ Real-time sync working
- ⏳ Ready to deploy to Vercel

---

## 🚀 Deploy to Production

### Vercel Deployment (5 minutes)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add Environment Variables:**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env`

4. **Update Firebase:**
   - Firebase Console → Authentication → Settings
   - Add your Vercel domain to Authorized domains

5. **Done!** Your quiz is live! 🎉

---

## 📞 Need Help?

1. Check `TESTING_GUIDE.md` for detailed testing steps
2. Check `SETUP_GUIDE.md` for Firebase setup
3. Check browser console for error messages
4. Check Firebase Console for data issues
5. Verify `.env` file has correct values

---

## 🎮 Have Fun!

Your quiz app is ready to use. Add your own questions, customize the design, and share with participants!

**Good luck and happy quizzing! 🎉**
