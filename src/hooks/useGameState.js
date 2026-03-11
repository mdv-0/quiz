import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    currentQuestionIndex: 0,
    status: 'waiting',
    questionStartedAt: null,
    round4FactStage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const gameStateRef = doc(db, 'game_state', 'current');

    const unsubscribe = onSnapshot(
      gameStateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setGameState(docSnap.data());
        } else {
          setDoc(gameStateRef, {
            currentQuestionIndex: 0,
            status: 'waiting',
            questionStartedAt: null,
            round4FactStage: 1,
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateGameState = async (updates) => {
    try {
      const gameStateRef = doc(db, 'game_state', 'current');
      await updateDoc(gameStateRef, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const startQuestion = async (questionIndex, options = {}) => {
    await updateGameState({
      currentQuestionIndex: questionIndex,
      status: 'question_active',
      questionStartedAt: Date.now(),
      round4FactStage: options.round4FactStage ?? 1,
    });
  };

  const showResults = async () => {
    await updateGameState({
      status: 'showing_results',
      questionStartedAt: null,
      round4FactStage: 1,
    });
  };

  const resetToWaiting = async () => {
    await updateGameState({
      status: 'waiting',
      questionStartedAt: null,
      round4FactStage: 1,
    });
  };

  const restartFromFirstQuestion = async () => {
    await updateGameState({
      currentQuestionIndex: 0,
      status: 'waiting',
      questionStartedAt: null,
      round4FactStage: 1,
    });
  };

  return {
    gameState,
    loading,
    error,
    updateGameState,
    startQuestion,
    showResults,
    resetToWaiting,
    restartFromFirstQuestion,
  };
};
