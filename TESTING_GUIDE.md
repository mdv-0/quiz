# Testing Guide

## Prerequisites Checklist

Before testing, ensure you have:

- ✅ Created Firebase project
- ✅ Enabled Firestore Database
- ✅ Enabled Email/Password Authentication
- ✅ Created an admin user in Firebase Authentication
- ✅ Created `.env` file with your Firebase credentials
- ✅ Deployed Firestore rules: `firebase deploy --only firestore:rules`
- ✅ Added sample questions to Firestore (see below)

## Step 1: Add Initial Data to Firestore

### Option A: Using Firebase Console (Recommended for first time)

1. **Go to Firebase Console → Firestore Database**

2. **Create `game_state` collection:**
   - Click "Start collection"
   - Collection ID: `game_state`
   - Document ID: `current`
   - Add fields:
     - `currentQuestionIndex` (number): `0`
     - `status` (string): `waiting`

3. **Create `questions` collection:**
   - Click "Start collection"
   - Collection ID: `questions`
   - Add these 5 documents (click "Add document" for each):

   **Document 1:**
   - Auto ID or use `q1`
   - Fields:
     - `id` (string): `q1`
     - `text` (string): `What is the capital of France?`
     - `mediaType` (string): `text`
     - `mediaUrl` (string): `` (empty)
     - `correctAnswer` (string): `Paris`

   **Document 2:**
   - Auto ID or use `q2`
   - Fields:
     - `id` (string): `q2`
     - `text` (string): `What is 5 + 7?`
     - `mediaType` (string): `text`
     - `mediaUrl` (string): `` (empty)
     - `correctAnswer` (string): `12`

   **Document 3:**
   - Auto ID or use `q3`
   - Fields:
     - `id` (string): `q3`
     - `text` (string): `Who painted the Mona Lisa?`
     - `mediaType` (string): `text`
     - `mediaUrl` (string): `` (empty)
     - `correctAnswer` (string): `Leonardo da Vinci`

   **Document 4:**
   - Auto ID or use `q4`
   - Fields:
     - `id` (string): `q4`
     - `text` (string): `What is the largest planet in our solar system?`
     - `mediaType` (string): `text`
     - `mediaUrl` (string): `` (empty)
     - `correctAnswer` (string): `Jupiter`

   **Document 5:**
   - Auto ID or use `q5`
   - Fields:
     - `id` (string): `q5`
     - `text` (string): `In which year did World War II end?`
     - `mediaType` (string): `text`
     - `mediaUrl` (string): `` (empty)
     - `correctAnswer` (string): `1945`

### Option B: Import Programmatically
See `add-sample-questions.js` for the data structure.

## Step 2: Start the Development Server

```bash
npm run dev
```

The app should start at `http://localhost:5173`

## Step 3: Test Participant Flow

### Test Case 1: Join Quiz

1. Open `http://localhost:5173/` in your browser
2. Enter a name (e.g., "Alice")
3. Click "Join Quiz"
4. **Expected Result:** 
   - You should see a waiting screen
   - Message: "Waiting for the admin to start the quiz..."
   - Should show number of participants

### Test Case 2: Multiple Participants

1. Open the same URL in 2-3 different browser windows (or incognito)
2. Join with different names (e.g., "Bob", "Charlie")
3. **Expected Result:** 
   - Each should see the waiting screen
   - Participant count should update in real-time

## Step 4: Test Admin Flow

### Test Case 3: Admin Login

1. Open `http://localhost:5173/admin` in a new browser window/tab
2. You should be redirected to `http://localhost:5173/admin/login`
3. Enter your admin credentials (from Firebase Authentication)
4. Click "Login"
5. **Expected Result:** 
   - Successful login redirects to admin dashboard
   - You see the questions list
   - You see current game status
   - You see scoreboard on the right

### Test Case 4: Start Question

1. In the admin dashboard, find the questions list
2. Click "Start" on Question 1
3. **Expected Result:**
   - Question status changes to "Active"
   - Question card displays below
   - All participant windows automatically show the question
   - Participants can now type and submit answers

## Step 5: Test Answer Submission

### Test Case 5: Submit Answers

1. In participant windows:
   - Alice types "Paris" → Submit
   - Bob types "London" → Submit (wrong answer)
   - Charlie types "paris" → Submit (lowercase)

2. **Expected Result:**
   - After submission, each participant sees "✅ Answer Submitted!"
   - Admin dashboard shows "Submitted Answers" section in real-time
   - Admin sees all 3 answers with "Correct" and "Incorrect" buttons

## Step 6: Test Answer Marking

### Test Case 6: Mark Answers

1. In admin dashboard, for each answer:
   - Mark Alice's "Paris" as ✓ Correct
   - Mark Bob's "London" as ✗ Incorrect
   - Mark Charlie's "paris" as ✓ Correct (admin accepts lowercase)

2. **Expected Result:**
   - Each marked answer changes color (green for correct, red for incorrect)
   - Buttons disappear after marking
   - Scoreboard updates in real-time
   - Alice: 1 point, Charlie: 1 point, Bob: 0 points

## Step 7: Test Results Display

### Test Case 7: Show Results

1. In admin dashboard, click "📊 Show Results"
2. **Expected Result:**
   - Admin sees "Results Displayed" with "➡️ Next Question" button
   - All participant windows show the scoreboard
   - Scores are sorted (Alice and Charlie tied at 1, Bob at 0)
   - Current participant's score is highlighted

## Step 8: Test Next Question

### Test Case 8: Continue Quiz

1. In admin dashboard, click "➡️ Next Question"
2. **Expected Result:**
   - Question 2 automatically starts
   - Participants see "What is 5 + 7?"
   - Answer submission forms are reset
   - Participants can submit new answers

### Test Case 9: Complete Quiz Flow

Repeat Test Cases 5-7 for Questions 2-5:
- Question 2: Expected answer "12"
- Question 3: Expected answer "Leonardo da Vinci"
- Question 4: Expected answer "Jupiter"
- Question 5: Expected answer "1945"

### Test Case 10: End Quiz

After the last question (Q5):
1. Mark all answers
2. Click "Show Results"
3. **Expected Result:**
   - Admin sees "🏁 End Quiz" button instead of "Next Question"
   - Clicking it sets status back to "waiting"
   - Final scoreboard is displayed

## Step 9: Test Real-Time Sync

### Test Case 11: Real-Time Updates

1. With multiple participant windows open:
   - Admin starts a question
   - **Check:** All participants see it instantly
   - One participant submits an answer
   - **Check:** Admin sees it appear in real-time
   - Admin marks an answer
   - **Check:** Score updates on all screens instantly

### Test Case 12: Late Join

1. While a quiz is in progress (question active):
   - Open a new browser window
   - Join with a new name
2. **Expected Result:**
   - New participant sees current question
   - Can submit answer
   - Appears in admin's participant list

## Step 10: Test Edge Cases

### Test Case 13: Refresh Behavior

1. **Participant:** Join, then refresh the page
   - **Expected:** Stays logged in (localStorage)
   
2. **Admin:** Log in, then refresh
   - **Expected:** Stays logged in (Firebase Auth persistence)

### Test Case 14: Empty States

1. Create a new Firebase project with no questions
2. **Expected Results:**
   - Participant: Can join and wait
   - Admin: Dashboard shows "No questions added yet"

### Test Case 15: Logout

1. In admin dashboard, click "Logout"
2. **Expected:** Redirected to login page

## Troubleshooting

### Issue: "Permission denied" errors
**Solution:** Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### Issue: Admin can't login
**Solution:** 
- Check admin user exists in Firebase Authentication
- Verify email/password are correct
- Check browser console for errors

### Issue: Participants don't see real-time updates
**Solution:**
- Check Firestore rules are deployed
- Check browser console for connection errors
- Verify Firebase project ID in `.env`

### Issue: Questions don't appear
**Solution:**
- Verify questions exist in Firestore
- Check Firestore collection name is exactly `questions`
- Verify each question has required fields

### Issue: Scores don't update
**Solution:**
- Check Firestore rules allow writes to `users` collection
- Verify admin has marked answer as correct
- Check browser console for errors

## Performance Notes

- Real-time updates should be instant (< 1 second)
- Multiple participants (10+) should work smoothly on free tier
- Check Firestore usage in Firebase Console to monitor quotas

## Success Criteria

✅ Participants can join and see waiting screen  
✅ Admin can login and see dashboard  
✅ Admin can start questions  
✅ Participants see questions in real-time  
✅ Participants can submit answers  
✅ Admin sees answers in real-time  
✅ Admin can mark answers correct/incorrect  
✅ Scores update in real-time for all users  
✅ Admin can show results  
✅ Admin can move to next question  
✅ All screens sync in real-time  

## Next Steps After Testing

Once everything works:
1. Add your own questions with media (images, videos)
2. Customize styling in Tailwind classes
3. Deploy to Vercel (see SETUP_GUIDE.md)
4. Add Firebase domain to authorized domains
5. Share quiz link with participants!

---

**Happy Testing! 🎉**
