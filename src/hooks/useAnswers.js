import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useAnswers = (questionId = null) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(Boolean(questionId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!questionId) {
      return;
    }
    queueMicrotask(() => setLoading(true));

    const answersRef = collection(db, 'answers');
    const q = query(answersRef, where('questionId', '==', questionId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const answersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAnswers(answersData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [questionId]);

  const submitAnswer = async (userId, questionId, answerText) => {
    try {
      const answersRef = collection(db, 'answers');
      const docRef = await addDoc(answersRef, {
        userId,
        questionId,
        answerText,
        isCorrect: null,
        timestamp: new Date()
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAnswer = async (answerId, isCorrect) => {
    try {
      const answerRef = doc(db, 'answers', answerId);
      await updateDoc(answerRef, { isCorrect });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    answers: questionId ? answers : [],
    loading: questionId ? loading : false,
    error,
    submitAnswer,
    markAnswer
  };
};
