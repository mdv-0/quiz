import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where, limit } from 'firebase/firestore';
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

  const submitAnswer = async (userId, questionId, answerText, metadata = {}) => {
    try {
      const answersRef = collection(db, 'answers');
      const existingQuery = query(
        answersRef,
        where('userId', '==', userId),
        where('questionId', '==', questionId),
        limit(1)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        throw new Error('Answer already submitted for this question');
      }

      const docRef = await addDoc(answersRef, {
        userId,
        questionId,
        answerText,
        round4FactStageAtSubmit: metadata.round4FactStageAtSubmit ?? null,
        round5BetPlaced: Boolean(metadata.round5BetPlaced),
        round5NoAnswer: Boolean(metadata.round5NoAnswer),
        isCorrect: null,
        awardedPoints: 0,
        timestamp: new Date()
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAnswer = async (answerId, isCorrect, points = 1) => {
    try {
      const answerRef = doc(db, 'answers', answerId);
      await updateDoc(answerRef, { isCorrect, awardedPoints: Number(points || 0) });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearAllAnswers = async () => {
    try {
      const answersRef = collection(db, 'answers');
      const snapshot = await getDocs(answersRef);
      await Promise.all(snapshot.docs.map((answerDoc) => deleteDoc(doc(db, 'answers', answerDoc.id))));
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
    markAnswer,
    clearAllAnswers
  };
};
