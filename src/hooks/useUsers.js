import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('score', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createUser = async (name) => {
    try {
      const usersRef = collection(db, 'users');
      const docRef = await addDoc(usersRef, {
        name,
        score: 0
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserScore = async (userId, newScore) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { score: newScore });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const incrementUserScore = async (userId, points = 1) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await updateUserScore(userId, user.score + points);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUserScore,
    incrementUserScore,
    deleteUser
  };
};
