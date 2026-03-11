// Sample script to add questions to Firestore
// Run this from Firebase Console > Firestore Database or use Firebase Admin SDK

// Copy and paste these documents into your Firestore 'questions' collection:

const sampleQuestions = [
  {
    id: "q1",
    text: "What is the capital of France?",
    mediaType: "text",
    mediaUrl: "",
    correctAnswer: "Paris"
  },
  {
    id: "q2",
    text: "What is 5 + 7?",
    mediaType: "text",
    mediaUrl: "",
    correctAnswer: "12"
  },
  {
    id: "q3",
    text: "Who painted the Mona Lisa?",
    mediaType: "text",
    mediaUrl: "",
    correctAnswer: "Leonardo da Vinci"
  },
  {
    id: "q4",
    text: "What is the largest planet in our solar system?",
    mediaType: "text",
    mediaUrl: "",
    correctAnswer: "Jupiter"
  },
  {
    id: "q5",
    text: "In which year did World War II end?",
    mediaType: "text",
    mediaUrl: "",
    correctAnswer: "1945"
  }
];

console.log('Sample Questions to add to Firestore:');
console.log(JSON.stringify(sampleQuestions, null, 2));

console.log('\n\nHOW TO ADD THESE TO FIRESTORE:');
console.log('1. Go to Firebase Console > Firestore Database');
console.log('2. Click "Start collection" and name it "questions"');
console.log('3. For each question above, click "Add document" and copy the fields');
console.log('   OR use the Firebase Admin SDK to import programmatically');
console.log('\n4. Also create a "game_state" collection with one document ID "current":');
console.log(JSON.stringify({
  currentQuestionIndex: 0,
  status: "waiting"
}, null, 2));
