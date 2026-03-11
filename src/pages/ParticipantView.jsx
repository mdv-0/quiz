import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useQuestions } from '../hooks/useQuestions';
import { useUsers } from '../hooks/useUsers';
import { useAnswers } from '../hooks/useAnswers';
import QuestionCard from '../components/QuestionCard';
import ScoreBoard from '../components/ScoreBoard';
import LoadingSpinner from '../components/LoadingSpinner';

const ParticipantView = () => {
  const [userName, setUserName] = useState(() => localStorage.getItem('quizUserName') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('quizUserId'));
  const [hasJoined, setHasJoined] = useState(() => {
    const savedUserId = localStorage.getItem('quizUserId');
    const savedUserName = localStorage.getItem('quizUserName');
    return Boolean(savedUserId && savedUserName);
  });
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [submittedByQuestion, setSubmittedByQuestion] = useState({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { gameState, loading: gameLoading } = useGameState();
  const { questions, loading: questionsLoading } = useQuestions();
  const { users, createUser } = useUsers();
  const { submitAnswer } = useAnswers();

  const currentQuestionIndex = gameState.currentQuestionIndex;
  const answerText = answerDrafts[currentQuestionIndex] || '';
  const hasSubmitted = Boolean(submittedByQuestion[currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];
  const timeLimitSec = Number(currentQuestion?.timeLimitSec || 30);
  const questionStartedAt = Number(gameState.questionStartedAt || 0);
  const hasActiveTimer = gameState.status === 'question_active' && questionStartedAt > 0;
  const remainingMs = hasActiveTimer
    ? Math.max(0, questionStartedAt + timeLimitSec * 1000 - nowMs)
    : timeLimitSec * 1000;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progressPercent = hasActiveTimer ? (remainingMs / (timeLimitSec * 1000)) * 100 : 100;
  const isTimeExpired = hasActiveTimer && remainingMs <= 0;
  const isTimerInDanger = remainingSec <= Math.max(5, Math.floor(timeLimitSec * 0.25));

  useEffect(() => {
    if (!hasJoined || !userId) {
      return;
    }

    const stillExists = users.some((u) => u.id === userId);
    if (!stillExists) {
      localStorage.removeItem('quizUserId');
      localStorage.removeItem('quizUserName');
      queueMicrotask(() => {
        setUserId(null);
        setUserName('');
        setHasJoined(false);
        setAnswerDrafts({});
        setSubmittedByQuestion({});
      });
    }
  }, [hasJoined, userId, users]);

  useEffect(() => {
    if (gameState.status !== 'question_active') {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [gameState.status]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    try {
      const newUserId = await createUser(userName.trim());
      setUserId(newUserId);
      setHasJoined(true);
      localStorage.setItem('quizUserId', newUserId);
      localStorage.setItem('quizUserName', userName.trim());
    } catch (error) {
      alert('Failed to join quiz: ' + error.message);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !userId || isTimeExpired) return;

    try {
      await submitAnswer(userId, currentQuestion.docId, answerText.trim());
      setSubmittedByQuestion((prev) => ({ ...prev, [currentQuestionIndex]: true }));
    } catch (error) {
      alert('Failed to submit answer: ' + error.message);
    }
  };

  if (gameLoading || questionsLoading) {
    return <LoadingSpinner />;
  }

  if (!hasJoined) {
    return (
      <div className="page-shell">
        <div className="glass-card w-full max-w-lg p-7 sm:p-10">
          <div className="text-center mb-7">
            <p className="badge badge-brand">Cinema Quiz</p>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4">Join The Session</h1>
            <p className="text-muted mt-3">Введите название команды, чтобы подключиться к викторине</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="field-label block">Название команды</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Например, White Space"
                className="field-input"
                maxLength={30}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full text-base">
              Начать
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (gameState.status === 'waiting') {
    return (
      <div className="page-shell">
        <div className="glass-card w-full max-w-xl p-8 sm:p-10 text-center">
          <p className="badge badge-neutral">Команда: {userName}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4">Ожидаем старт от ведущего</h2>
          <p className="text-muted mt-3">Как только ведущий запустит раунд, вопрос появится здесь.</p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#2d214f] border border-[#5e4792] px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-sm sm:text-base">
              Готовы: {users.length} participant{users.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'question_active' && currentQuestion) {
    return (
      <div className="control-shell">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="surface-card p-4 sm:p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Команда</p>
              <p className="font-semibold text-lg">{userName}</p>
            </div>
            <span className="badge badge-brand">Раунд {currentQuestionIndex + 1}</span>
          </div>

          <div className="surface-card p-4 sm:p-5 sticky top-3 z-20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted">Таймер вопроса</p>
              <p className={`text-sm font-semibold ${isTimeExpired ? 'text-rose-300' : 'text-violet-200'}`}>
                {remainingSec}s
              </p>
            </div>
            <div className="timer-track">
              <div
                className={`timer-fill ${isTimerInDanger ? 'danger' : ''}`}
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
              />
            </div>
          </div>

          <QuestionCard question={currentQuestion} questionNumber={currentQuestionIndex + 1} />

          {!hasSubmitted ? (
            <div className="glass-card p-6 sm:p-8">
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <div>
                  <label className="field-label block">Ваш ответ</label>
                  <textarea
                    value={answerText}
                    onChange={(e) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: e.target.value,
                      }))
                    }
                    placeholder={isTimeExpired ? 'Время вышло' : 'Введите ответ'}
                    className="field-textarea min-h-32"
                    rows="4"
                    required
                    disabled={isTimeExpired}
                  />
                </div>

                <button type="submit" className="btn btn-secondary w-full" disabled={isTimeExpired}>
                  {isTimeExpired ? 'Время вышло' : 'Отправить ответ'}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <h3 className="text-2xl font-bold">Ответ отправлен</h3>
              <p className="text-muted mt-2">Ожидайте оценку от ведущего.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.status === 'showing_results') {
    return (
      <div className="control-shell">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="surface-card p-6 text-center">
            <p className="badge badge-brand">Результаты раунда</p>
            <h2 className="text-3xl font-bold mt-4">Таблица очков</h2>
          </div>

          <ScoreBoard users={users} currentUserId={userId} />

          <div className="surface-card p-4 text-center text-muted font-medium">Ожидаем следующий вопрос...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default ParticipantView;
