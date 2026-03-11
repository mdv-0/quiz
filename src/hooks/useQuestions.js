import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const questionsRef = collection(db, 'questions');
    const q = query(questionsRef, orderBy('id', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        setQuestions(questionsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addQuestion = async (questionData) => {
    try {
      const questionsRef = collection(db, 'questions');
      await addDoc(questionsRef, questionData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateQuestion = async (docId, updates) => {
    try {
      const questionRef = doc(db, 'questions', docId);
      await updateDoc(questionRef, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteQuestion = async (docId) => {
    try {
      const questionRef = doc(db, 'questions', docId);
      await deleteDoc(questionRef);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    questions,
    loading,
    error,
    addQuestion,
    updateQuestion,
    deleteQuestion
  };
};
