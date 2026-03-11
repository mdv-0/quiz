import { useState } from 'react';
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { gameState, startQuestion, showResults, resetToWaiting, restartFromFirstQuestion, updateGameState } = useGameState();
  const { questions, loading: questionsLoading, addQuestion, deleteQuestion } = useQuestions();
  const { users, incrementUserScore, deleteUser } = useUsers();

  const currentQuestion = questions[gameState.currentQuestionIndex];
  const { answers, markAnswer } = useAnswers(currentQuestion?.docId);

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    mediaType: 'text',
    mediaUrl: '',
    correctAnswer: '',
    timeLimitSec: 30,
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await startQuestion(index);
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
      await markAnswer(answerId, isCorrect);
      if (isCorrect) {
        await incrementUserScore(userId);
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

  const resetQuestionForm = () => {
    setNewQuestion({
      text: '',
      mediaType: 'text',
      mediaUrl: '',
      correctAnswer: '',
      timeLimitSec: 30,
    });
    setMediaFile(null);
    setShowAddQuestion(false);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();

    if (!newQuestion.text.trim() || !newQuestion.correctAnswer.trim()) {
      alert('Please fill in question text and correct answer');
      return;
    }

    if (newQuestion.mediaType !== 'text' && !mediaFile && !newQuestion.mediaUrl.trim()) {
      alert('Add media URL or upload a local file for this media type');
      return;
    }

    const timerSec = Number(newQuestion.timeLimitSec);
    if (!Number.isFinite(timerSec) || timerSec < 5 || timerSec > 600) {
      alert('Timer should be between 5 and 600 seconds');
      return;
    }

    setIsSubmitting(true);
    try {
      const questionId = `q${Date.now()}`;
      const mediaUrl = await uploadMediaIfNeeded();

      await addQuestion({
        id: questionId,
        text: newQuestion.text.trim(),
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
      await updateGameState({
        currentQuestionIndex: nextIndex,
        status: 'waiting',
        questionStartedAt: null,
      });
    } catch (error) {
      alert('Failed to switch question: ' + error.message);
    }
  };

  if (questionsLoading) {
    return <LoadingSpinner />;
  }

  const isActiveQuestion = gameState.status === 'question_active' && currentQuestion;

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
                <button onClick={handleSwitchToNextQuestion} className="btn btn-secondary">
                  Next Question
                </button>
                <button onClick={handleRestartFromFirst} className="btn btn-danger ml-auto">
                  Restart from Q1
                </button>
              </div>
            </section>

            {isActiveQuestion && (
              <section className="space-y-4">
                <QuestionCard question={currentQuestion} questionNumber={gameState.currentQuestionIndex + 1} />
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

                    <div>
                      <label className="field-label block">Timer (sec)</label>
                      <input
                        type="number"
                        min="5"
                        max="600"
                        step="1"
                        value={newQuestion.timeLimitSec}
                        onChange={(e) => setNewQuestion({ ...newQuestion, timeLimitSec: e.target.value })}
                        className="field-input"
                        required
                      />
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
                      const canStartThisQuestion =
                        gameState.status === 'waiting' && index === gameState.currentQuestionIndex;

                      return (
                        <article
                          key={question.docId}
                          className={`surface-card p-4 sm:p-5 border ${isCurrent ? 'border-[#8e5bff]' : 'border-transparent'}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="font-bold">Q{index + 1}</span>
                                <span className="badge badge-neutral">{question.mediaType}</span>
                                <span className="badge badge-neutral">{question.timeLimitSec || 30}s</span>
                              </div>
                              <p className="font-medium">{question.text}</p>
                              <p className="text-sm text-muted mt-2">Expected: {question.correctAnswer}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
                              <button
                                onClick={() => handleStartQuestion(index)}
                                disabled={!canStartThisQuestion}
                                className="btn btn-secondary"
                                title={
                                  canStartThisQuestion
                                    ? 'Start this question'
                                    : 'Сейчас можно запускать только текущий вопрос в режиме waiting'
                                }
                              >
                                {isCurrent ? 'Active' : canStartThisQuestion ? 'Start' : 'Locked'}
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.docId, question.text)}
                                disabled={isCurrent}
                                className="btn btn-danger"
                                title="Delete question"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </details>
              )}
            </section>

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
