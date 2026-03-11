import { useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameState } from '../hooks/useGameState';
import { useQuestions } from '../hooks/useQuestions';
import { useUsers } from '../hooks/useUsers';
import { useAnswers } from '../hooks/useAnswers';
import { storage } from '../config/firebase';
import QuestionCard from '../components/QuestionCard';
import AnswerList from '../components/AnswerList';
import ScoreBoard from '../components/ScoreBoard';
import LoadingSpinner from '../components/LoadingSpinner';

const statusText = {
  waiting: 'Waiting',
  question_active: 'Question Active',
  showing_results: 'Showing Results',
};

const mediaAcceptByType = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
};

const defaultQuestionDraft = () => ({
  round: 1,
  text: '',
  facts: ['', '', ''],
  mediaType: 'text',
  mediaUrl: '',
  correctAnswer: '',
  timeLimitSec: 30,
});

const normalizeFacts = (facts = []) => {
  const base = Array.isArray(facts) ? facts.slice(0, 3) : [];
  while (base.length < 3) {
    base.push('');
  }
  return base;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    gameState,
    startQuestion,
    startMediaPlayback,
    completeMediaPlaybackAndStartTimer,
    showResults,
    resetToWaiting,
    restartFromFirstQuestion,
  } = useGameState();
  const { questions, loading: questionsLoading, addQuestion, updateQuestion, deleteQuestion } = useQuestions();
  const { users, incrementUserScore, deleteUser } = useUsers();

  const currentQuestion = questions[gameState.currentQuestionIndex];
  const { answers, markAnswer, clearAllAnswers } = useAnswers(currentQuestion?.docId);

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState(defaultQuestionDraft);
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(defaultQuestionDraft);
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const isRound4CurrentQuestion = Number(currentQuestion?.round) === 4;
  const isRound5CurrentQuestion = Number(currentQuestion?.round) === 5;
  const isManagedMediaQuestion = currentQuestion?.mediaType === 'audio' || currentQuestion?.mediaType === 'video';
  const mediaPlaybackState = gameState.mediaPlaybackState || 'completed';
  const factDurationSec = 30;
  const round4TotalSec = factDurationSec * 3;
  const defaultTimeLimitSec = Number(currentQuestion?.timeLimitSec || 30);
  const timeLimitSec = isRound4CurrentQuestion ? round4TotalSec : defaultTimeLimitSec;
  const questionStartedAt = Number(gameState.questionStartedAt || 0);
  const hasActiveTimer = gameState.status === 'question_active' && questionStartedAt > 0;
  const elapsedMs = hasActiveTimer ? Math.max(0, nowMs - questionStartedAt) : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const round4FactStage = isRound4CurrentQuestion
    ? Math.min(3, Math.floor(elapsedMs / (factDurationSec * 1000)) + 1)
    : 1;
  const remainingInFactSec = isRound4CurrentQuestion
    ? Math.ceil(Math.max(0, factDurationSec * 1000 - (elapsedMs % (factDurationSec * 1000))) / 1000)
    : 0;
  const remainingMs = hasActiveTimer
    ? Math.max(0, questionStartedAt + timeLimitSec * 1000 - nowMs)
    : timeLimitSec * 1000;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const timerWaitingForMedia = gameState.status === 'question_active' && !hasActiveTimer && isManagedMediaQuestion;
  const progressPercent = hasActiveTimer ? (remainingMs / (timeLimitSec * 1000)) * 100 : 100;
  const factProgressPercent = isRound4CurrentQuestion
    ? (Math.max(0, factDurationSec * 1000 - (elapsedMs % (factDurationSec * 1000))) / (factDurationSec * 1000)) * 100
    : progressPercent;
  const timerDangerThreshold = isRound4CurrentQuestion
    ? Math.max(5, Math.floor(factDurationSec * 0.25))
    : Math.max(5, Math.floor(timeLimitSec * 0.25));
  const isTimerInDanger = isRound4CurrentQuestion
    ? remainingInFactSec <= timerDangerThreshold
    : remainingSec <= timerDangerThreshold;

  useEffect(() => {
    if (gameState.status !== 'question_active') {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [gameState.status]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch {
      alert('Failed to logout');
    }
  };

  const handleStartQuestion = async (index) => {
    try {
      const targetQuestion = questions[index];
      const waitForMedia = targetQuestion?.mediaType === 'audio' || targetQuestion?.mediaType === 'video';
      await startQuestion(index, { waitForMedia });
    } catch (error) {
      alert('Failed to start question: ' + error.message);
    }
  };

  const handleShowResults = async () => {
    try {
      await showResults();
    } catch (error) {
      alert('Failed to show results: ' + error.message);
    }
  };

  const handleNextQuestion = async () => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      await handleStartQuestion(nextIndex);
    }
  };

  const handleMarkAnswer = async (answerId, userId, isCorrect) => {
    try {
      const answerRecord = answers.find((answer) => answer.id === answerId);
      const factStageAtSubmit = Number(answerRecord?.round4FactStageAtSubmit || round4FactStage);
      const isRound5BetPlaced = Boolean(answerRecord?.round5BetPlaced);
      let pointsForAnswer = 0;

      if (isRound4CurrentQuestion) {
        pointsForAnswer = isCorrect ? Math.max(1, 4 - factStageAtSubmit) : 0;
      } else if (isRound5CurrentQuestion) {
        if (isCorrect) {
          pointsForAnswer = isRound5BetPlaced ? 2 : 1;
        } else {
          pointsForAnswer = isRound5BetPlaced ? -2 : 0;
        }
      } else {
        pointsForAnswer = isCorrect ? 1 : 0;
      }

      await markAnswer(answerId, isCorrect, pointsForAnswer);
      if (pointsForAnswer !== 0) {
        await incrementUserScore(userId, pointsForAnswer);
      }
    } catch (error) {
      alert('Failed to mark answer: ' + error.message);
    }
  };

  const uploadMediaIfNeeded = async () => {
    if (newQuestion.mediaType === 'text') {
      return '';
    }

    if (mediaFile) {
      const safeFileName = mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `question-media/${Date.now()}_${safeFileName}`;
      const mediaRef = ref(storage, filePath);

      await uploadBytes(mediaRef, mediaFile);
      return await getDownloadURL(mediaRef);
    }

    return newQuestion.mediaUrl.trim();
  };

  const uploadEditedMediaIfNeeded = async () => {
    if (editQuestion.mediaType === 'text') {
      return '';
    }

    if (editMediaFile) {
      const safeFileName = editMediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `question-media/${Date.now()}_${safeFileName}`;
      const mediaRef = ref(storage, filePath);

      await uploadBytes(mediaRef, editMediaFile);
      return await getDownloadURL(mediaRef);
    }

    return editQuestion.mediaUrl.trim();
  };

  const resetQuestionForm = () => {
    setNewQuestion(defaultQuestionDraft());
    setMediaFile(null);
    setShowAddQuestion(false);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();

    const round = Number(newQuestion.round || 1);
    if (!newQuestion.text.trim() || !newQuestion.correctAnswer.trim()) {
      alert('Please fill in question text and correct answer');
      return;
    }

    if (newQuestion.mediaType !== 'text' && !mediaFile && !newQuestion.mediaUrl.trim()) {
      alert('Add media URL or upload a local file for this media type');
      return;
    }

    const timerSec = round === 5 ? 30 : Number(newQuestion.timeLimitSec);
    if (!Number.isFinite(timerSec) || timerSec < 5 || timerSec > 600) {
      alert('Timer should be between 5 and 600 seconds');
      return;
    }

    const facts = normalizeFacts(newQuestion.facts);
    if (round === 4 && facts.some((fact) => !fact.trim())) {
      alert('Round 4 requires three separate facts');
      return;
    }

    setIsSubmitting(true);
    try {
      const questionId = `q${Date.now()}`;
      const mediaUrl = await uploadMediaIfNeeded();

      await addQuestion({
        id: questionId,
        text: newQuestion.text.trim(),
        round,
        facts: round === 4 ? facts.map((fact) => fact.trim()) : [],
        mediaType: newQuestion.mediaType,
        mediaUrl,
        correctAnswer: newQuestion.correctAnswer.trim(),
        timeLimitSec: timerSec,
      });

      resetQuestionForm();
      alert('Question created successfully!');
    } catch (error) {
      alert('Failed to create question: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (docId, questionText) => {
    if (!confirm(`Are you sure you want to delete: "${questionText}"?`)) {
      return;
    }

    try {
      await deleteQuestion(docId);
      alert('Question deleted successfully!');
    } catch (error) {
      alert('Failed to delete question: ' + error.message);
    }
  };

  const startEditQuestion = (question) => {
    setEditingQuestionId(question.docId);
    setEditQuestion({
      round: Number(question.round || 1),
      text: question.text || '',
      facts: normalizeFacts(question.facts),
      mediaType: question.mediaType || 'text',
      mediaUrl: question.mediaUrl || '',
      correctAnswer: question.correctAnswer || '',
      timeLimitSec: Number(question.timeLimitSec || 30),
    });
    setEditMediaFile(null);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditQuestion(defaultQuestionDraft());
    setEditMediaFile(null);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestionId) return;

    if (!editQuestion.text.trim() || !editQuestion.correctAnswer.trim()) {
      alert('Please fill in question text and correct answer');
      return;
    }

    if (editQuestion.mediaType !== 'text' && !editMediaFile && !editQuestion.mediaUrl.trim()) {
      alert('Add media URL or upload a local file for this media type');
      return;
    }

    const round = Number(editQuestion.round || 1);
    const timerSec = round === 5 ? 30 : Number(editQuestion.timeLimitSec);
    if (!Number.isFinite(timerSec) || timerSec < 5 || timerSec > 600) {
      alert('Timer should be between 5 and 600 seconds');
      return;
    }

    const facts = normalizeFacts(editQuestion.facts);
    if (round === 4 && facts.some((fact) => !fact.trim())) {
      alert('Round 4 requires three separate facts');
      return;
    }

    setIsUpdating(true);
    try {
      const mediaUrl = await uploadEditedMediaIfNeeded();
      await updateQuestion(editingQuestionId, {
        round,
        text: editQuestion.text.trim(),
        facts: round === 4 ? facts.map((fact) => fact.trim()) : [],
        mediaType: editQuestion.mediaType,
        mediaUrl,
        correctAnswer: editQuestion.correctAnswer.trim(),
        timeLimitSec: timerSec,
      });
      cancelEditQuestion();
    } catch (error) {
      alert('Failed to update question: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Delete participant "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
    } catch (error) {
      alert('Failed to delete participant: ' + error.message);
    }
  };

  const handleRestartFromFirst = async () => {
    if (!confirm('Restart quiz from Question 1? Current round progress will be reset.')) {
      return;
    }
    try {
      await clearAllAnswers();
      await restartFromFirstQuestion();
    } catch (error) {
      alert('Failed to restart quiz: ' + error.message);
    }
  };

  const handleSwitchToNextQuestion = async () => {
    if (questions.length === 0) {
      return;
    }

    const nextIndex = gameState.currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      alert('Это уже последний вопрос.');
      return;
    }

    try {
      await handleStartQuestion(nextIndex);
    } catch (error) {
      alert('Failed to switch question: ' + error.message);
    }
  };

  const handleStartCurrentQuestion = async () => {
    try {
      // Starting question #1 means a new game cycle: clear old answers first.
      if (gameState.currentQuestionIndex === 0 && gameState.status === 'waiting') {
        await clearAllAnswers();
      }
      await handleStartQuestion(gameState.currentQuestionIndex);
    } catch (error) {
      alert('Failed to start current question: ' + error.message);
    }
  };

  const handleStartManagedMedia = async () => {
    try {
      if (mediaPlaybackState !== 'pending') {
        return;
      }
      await startMediaPlayback();
    } catch (error) {
      alert('Failed to start media: ' + error.message);
    }
  };

  const handleManagedMediaEnded = async () => {
    try {
      if (mediaPlaybackState !== 'playing') {
        return;
      }
      await completeMediaPlaybackAndStartTimer();
    } catch (error) {
      alert('Failed to start timer after media: ' + error.message);
    }
  };

  if (questionsLoading) {
    return <LoadingSpinner />;
  }

  const isActiveQuestion = gameState.status === 'question_active' && currentQuestion;
  const previewQuestion =
    previewQuestionIndex === null ? null : questions[previewQuestionIndex] || null;

  return (
    <div className="control-shell">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="badge badge-brand">Admin Session</p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-3">Cinema Quiz Control Room</h1>
            <p className="text-muted mt-2 text-sm">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger w-full sm:w-auto">
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <section className="surface-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="font-semibold">Game Status:</p>
                <span className="badge badge-neutral">{statusText[gameState.status] || gameState.status}</span>
                <button
                  onClick={handleStartCurrentQuestion}
                  disabled={gameState.status !== 'waiting' || questions.length === 0}
                  className="btn btn-secondary"
                >
                  Start Current Question
                </button>
                <button onClick={handleSwitchToNextQuestion} className="btn btn-secondary">
                  Next Question
                </button>
                <button onClick={handleRestartFromFirst} className="btn btn-danger ml-auto">
                  Restart from Q1
                </button>
              </div>
              {gameState.status === 'question_active' && currentQuestion && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted">
                      {isRound4CurrentQuestion ? `Admin timer - Факт ${round4FactStage}/3` : 'Admin timer'}
                    </p>
                    <p className={`text-sm font-semibold ${remainingSec <= 0 ? 'text-rose-300' : 'text-violet-200'}`}>
                      {timerWaitingForMedia
                        ? 'Старт после завершения медиа'
                        : isRound4CurrentQuestion
                          ? `${remainingInFactSec}s`
                          : `${remainingSec}s`}
                    </p>
                  </div>
                  <div className="timer-track">
                    <div
                      className={`timer-fill ${isTimerInDanger ? 'danger' : ''}`}
                      style={{ width: `${timerWaitingForMedia ? 100 : Math.max(0, Math.min(100, factProgressPercent))}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {isActiveQuestion && (
              <section className="space-y-4">
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={gameState.currentQuestionIndex + 1}
                  factStage={round4FactStage}
                  mediaMode="quiz"
                  mediaPlaybackState={mediaPlaybackState}
                  canControlMedia
                  onStartMedia={handleStartManagedMedia}
                  onMediaCompleted={handleManagedMediaEnded}
                />
                <div className="surface-card p-4 sm:p-5">
                  <p className="text-sm text-muted">Правильный ответ</p>
                  <p className="text-lg font-semibold mt-1">{currentQuestion.correctAnswer}</p>
                </div>
                {isRound4CurrentQuestion && (
                  <div className="surface-card p-4 sm:p-5 flex flex-wrap items-center gap-2.5">
                    <span className="badge badge-neutral">Факт {round4FactStage} из 3</span>
                    <span className="text-sm text-muted">Баллы за правильный ответ: {Math.max(1, 4 - round4FactStage)}</span>
                  </div>
                )}
                <AnswerList answers={answers} users={users} onMarkAnswer={handleMarkAnswer} />
                <button onClick={handleShowResults} className="btn btn-secondary w-full">
                  Show Results To All
                </button>
              </section>
            )}

            <section className="glass-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-2xl font-bold">Questions</h2>
                <button
                  onClick={() => setShowAddQuestion(!showAddQuestion)}
                  className={`btn ${showAddQuestion ? 'btn-danger' : 'btn-secondary'} w-full sm:w-auto`}
                >
                  {showAddQuestion ? 'Cancel' : 'New Question'}
                </button>
              </div>

              {showAddQuestion && (
                <form onSubmit={handleCreateQuestion} className="surface-card p-4 sm:p-5 mb-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label block">Round</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        value={newQuestion.round}
                        onChange={(e) => {
                          const round = Number(e.target.value || 1);
                          setNewQuestion((prev) => ({
                            ...prev,
                            round,
                            timeLimitSec: round === 5 ? 30 : prev.timeLimitSec,
                          }));
                        }}
                        className="field-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label block">Timer (sec)</label>
                      <input
                        type="number"
                        min="5"
                        max="600"
                        step="1"
                        value={newQuestion.round === 5 ? 30 : newQuestion.timeLimitSec}
                        onChange={(e) => setNewQuestion({ ...newQuestion, timeLimitSec: e.target.value })}
                        className="field-input"
                        disabled={Number(newQuestion.round) === 5}
                        required
                      />
                      {Number(newQuestion.round) === 5 && (
                        <p className="text-xs text-muted mt-2">Для 5 раунда таймер фиксирован: 30 сек.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="field-label block">Question Text</label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      className="field-textarea"
                      rows="3"
                      required
                    />
                  </div>

                  {Number(newQuestion.round) === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {newQuestion.facts.map((fact, factIndex) => (
                        <div key={factIndex}>
                          <label className="field-label block">Факт {factIndex + 1}</label>
                          <textarea
                            value={fact}
                            onChange={(e) => {
                              const nextFacts = [...newQuestion.facts];
                              nextFacts[factIndex] = e.target.value;
                              setNewQuestion({ ...newQuestion, facts: nextFacts });
                            }}
                            className="field-textarea"
                            rows="3"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label block">Media Type</label>
                      <select
                        value={newQuestion.mediaType}
                        onChange={(e) => {
                          const mediaType = e.target.value;
                          setNewQuestion({
                            ...newQuestion,
                            mediaType,
                            mediaUrl: mediaType === 'text' ? '' : newQuestion.mediaUrl,
                          });
                          if (mediaType === 'text') {
                            setMediaFile(null);
                          }
                        }}
                        className="field-select"
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>
                  </div>

                  {newQuestion.mediaType !== 'text' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="field-label block">Media URL</label>
                        <input
                          type="url"
                          value={newQuestion.mediaUrl}
                          onChange={(e) => setNewQuestion({ ...newQuestion, mediaUrl: e.target.value })}
                          placeholder="https://example.com/media"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label block">Upload local {newQuestion.mediaType}</label>
                        <input
                          type="file"
                          accept={mediaAcceptByType[newQuestion.mediaType]}
                          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                          className="field-input"
                        />
                        {mediaFile && <p className="text-muted text-xs mt-2">Selected: {mediaFile.name}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="field-label block">Correct Answer</label>
                    <input
                      type="text"
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                      {isSubmitting ? 'Creating...' : 'Create Question'}
                    </button>
                    <button type="button" onClick={resetQuestionForm} className="btn bg-[#3a2a62] text-white hover:bg-[#4a347b]">
                      Reset
                    </button>
                  </div>
                </form>
              )}

              {questions.length === 0 ? (
                <p className="text-muted text-center py-10">No questions yet.</p>
              ) : (
                <details className="space-y-3" open>
                  <summary className="cursor-pointer select-none text-sm text-muted mb-3">
                    Question Bank ({questions.length}) - отдельное окно просмотра
                  </summary>
                  <div className="space-y-3">
                    {questions.map((question, index) => {
                      const isCurrent = gameState.currentQuestionIndex === index && gameState.status === 'question_active';
                      const isEditingThisQuestion = editingQuestionId === question.docId;

                      return (
                        <article
                          key={question.docId}
                          className={`surface-card p-4 sm:p-5 border ${isCurrent ? 'border-[#8e5bff]' : 'border-transparent'}`}
                        >
                          {isEditingThisQuestion ? (
                            <form onSubmit={handleUpdateQuestion} className="space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold">Editing Q{index + 1}</span>
                                <span className="badge badge-neutral">{question.round ? `Round ${question.round}` : 'Question'}</span>
                              </div>

                              <div>
                                <label className="field-label block">Question Text</label>
                                <textarea
                                  value={editQuestion.text}
                                  onChange={(e) => setEditQuestion({ ...editQuestion, text: e.target.value })}
                                  className="field-textarea"
                                  rows="4"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="field-label block">Round</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={editQuestion.round}
                                    onChange={(e) => {
                                      const round = Number(e.target.value || 1);
                                      setEditQuestion((prev) => ({
                                        ...prev,
                                        round,
                                        timeLimitSec: round === 5 ? 30 : prev.timeLimitSec,
                                      }));
                                    }}
                                    className="field-input"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="field-label block">Media Type</label>
                                  <select
                                    value={editQuestion.mediaType}
                                    onChange={(e) => {
                                      const mediaType = e.target.value;
                                      setEditQuestion({
                                        ...editQuestion,
                                        mediaType,
                                        mediaUrl: mediaType === 'text' ? '' : editQuestion.mediaUrl,
                                      });
                                      if (mediaType === 'text') {
                                        setEditMediaFile(null);
                                      }
                                    }}
                                    className="field-select"
                                  >
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                    <option value="audio">Audio</option>
                                  </select>
                                </div>
                              </div>

                              {Number(editQuestion.round) === 4 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {editQuestion.facts.map((fact, factIndex) => (
                                    <div key={factIndex}>
                                      <label className="field-label block">Факт {factIndex + 1}</label>
                                      <textarea
                                        value={fact}
                                        onChange={(e) => {
                                          const nextFacts = [...editQuestion.facts];
                                          nextFacts[factIndex] = e.target.value;
                                          setEditQuestion({ ...editQuestion, facts: nextFacts });
                                        }}
                                        className="field-textarea"
                                        rows="3"
                                        required
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="field-label block">Timer (sec)</label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="600"
                                    step="1"
                                    value={Number(editQuestion.round) === 5 ? 30 : editQuestion.timeLimitSec}
                                    onChange={(e) => setEditQuestion({ ...editQuestion, timeLimitSec: e.target.value })}
                                    className="field-input"
                                    disabled={Number(editQuestion.round) === 5}
                                    required
                                  />
                                  {Number(editQuestion.round) === 5 && (
                                    <p className="text-xs text-muted mt-2">Для 5 раунда таймер фиксирован: 30 сек.</p>
                                  )}
                                </div>
                              </div>

                              {editQuestion.mediaType !== 'text' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="field-label block">Media URL</label>
                                    <input
                                      type="url"
                                      value={editQuestion.mediaUrl}
                                      onChange={(e) => setEditQuestion({ ...editQuestion, mediaUrl: e.target.value })}
                                      className="field-input"
                                      placeholder="https://example.com/media"
                                    />
                                  </div>
                                  <div>
                                    <label className="field-label block">Upload local {editQuestion.mediaType}</label>
                                    <input
                                      type="file"
                                      accept={mediaAcceptByType[editQuestion.mediaType]}
                                      onChange={(e) => setEditMediaFile(e.target.files?.[0] || null)}
                                      className="field-input"
                                    />
                                    {editMediaFile && <p className="text-muted text-xs mt-2">Selected: {editMediaFile.name}</p>}
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="field-label block">Correct Answer</label>
                                <input
                                  type="text"
                                  value={editQuestion.correctAnswer}
                                  onChange={(e) => setEditQuestion({ ...editQuestion, correctAnswer: e.target.value })}
                                  className="field-input"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                                  {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                                <button type="button" onClick={cancelEditQuestion} className="btn bg-[#3a2a62] text-white hover:bg-[#4a347b]">
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(question.docId, question.text)}
                                  disabled={isCurrent || isUpdating}
                                  className="btn btn-danger"
                                >
                                  Delete
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="font-bold">Q{index + 1}</span>
                                  <span className="badge badge-neutral">Round {question.round || 1}</span>
                                  <span className="badge badge-neutral">{question.mediaType}</span>
                                  <span className="badge badge-neutral">{question.timeLimitSec || 30}s</span>
                                </div>
                                <p className="font-medium">{question.text}</p>
                                <p className="text-sm text-muted mt-2">Expected: {question.correctAnswer}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewQuestionIndex(index)}
                                  className="btn bg-[#3a2a62] text-white hover:bg-[#4a347b]"
                                  title="Preview question"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditQuestion(question)}
                                  className="btn btn-secondary"
                                  title="Edit question"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(question.docId, question.text)}
                                  disabled={isCurrent}
                                  className="btn btn-danger"
                                  title="Delete question"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </details>
              )}
            </section>

            {previewQuestion && (
              <section className="fixed inset-0 z-50 bg-[#0c0718]/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="surface-card p-4 sm:p-5 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">Preview: Q{previewQuestionIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => setPreviewQuestionIndex(null)}
                      className="btn bg-[#3a2a62] text-white hover:bg-[#4a347b]"
                    >
                      Close Preview
                    </button>
                  </div>
                  <QuestionCard
                    question={previewQuestion}
                    questionNumber={previewQuestionIndex + 1}
                    factStage={Number(previewQuestion?.round) === 4 ? 3 : 1}
                  />
                </div>
              </section>
            )}

            {gameState.status === 'showing_results' && (
              <section className="surface-card p-5 sm:p-6 space-y-4">
                <h3 className="text-xl font-bold">Results Displayed</h3>
                {gameState.currentQuestionIndex + 1 < questions.length ? (
                  <button onClick={handleNextQuestion} className="btn btn-primary w-full">
                    Подтвердить и запустить следующий
                  </button>
                ) : (
                  <button onClick={resetToWaiting} className="btn btn-primary w-full">
                    End Quiz
                  </button>
                )}
              </section>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <ScoreBoard users={users} />

              <section className="surface-card p-5">
                <h3 className="text-xl font-bold mb-4">Statistics</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-[#2f2154] px-3 py-2">
                    <span className="text-muted">Total Participants</span>
                    <strong>{users.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#2f2154] px-3 py-2">
                    <span className="text-muted">Total Questions</span>
                    <strong>{questions.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#2f2154] px-3 py-2">
                    <span className="text-muted">Current Question</span>
                    <strong>{gameState.currentQuestionIndex + 1}</strong>
                  </div>
                </div>
              </section>

              <section className="surface-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Participants</h3>
                  <span className="badge badge-neutral">{users.length}</span>
                </div>

                {users.length === 0 ? (
                  <p className="text-muted text-sm">No participants yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {users.map((participant) => (
                      <article
                        key={participant.id}
                        className="rounded-lg bg-[#2f2154] px-3 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{participant.name}</p>
                          <p className="text-xs text-muted">{participant.score} pts</p>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(participant.id, participant.name)}
                          className="btn btn-danger !px-3 !py-2 !text-xs"
                          title={`Delete ${participant.name}`}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
