const AnswerList = ({ answers, users, onMarkAnswer }) => {
  if (!answers || answers.length === 0) {
    return (
      <section className="glass-card p-5 sm:p-6">
        <h3 className="text-xl font-bold mb-3">Submitted Answers</h3>
        <p className="text-muted">Waiting for participants...</p>
      </section>
    );
  }

  const getUserName = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  return (
    <section className="glass-card p-5 sm:p-6">
      <h3 className="text-xl font-bold mb-4">Submitted Answers ({answers.length})</h3>

      <div className="space-y-3">
        {answers.map((answer) => (
          <article
            key={answer.id}
            className={`rounded-xl border p-4 ${
              answer.isCorrect === true
                ? 'bg-[#183933] border-[#2c7f72]'
                : answer.isCorrect === false
                  ? 'bg-[#42192d] border-[#a13d66]'
                  : 'bg-[#26193f] border-[#5f4695]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-semibold">{getUserName(answer.userId)}</p>
                <p className="mt-1 text-[#ddd2ff]">{answer.answerText}</p>
                {answer.round4FactStageAtSubmit && (
                  <p className="mt-1 text-xs text-violet-300">
                    Ответ отправлен на факте {answer.round4FactStageAtSubmit}
                  </p>
                )}
                {answer.round5BetPlaced && (
                  <p className="mt-1 text-xs text-amber-300">Ставка активна (+2 / -2)</p>
                )}
                {answer.round5NoAnswer && (
                  <p className="mt-1 text-xs text-rose-300">Авто-ответ без текста: примените штраф при Incorrect</p>
                )}

                {answer.isCorrect !== null && (
                  <span className={`badge mt-3 ${Number(answer.awardedPoints || 0) >= 0 ? 'bg-[#2c7f72] text-white' : 'bg-[#a13d66] text-white'}`}>
                    {answer.isCorrect
                      ? `Correct (+${Number(answer.awardedPoints || 0)} pts)`
                      : `Incorrect (${Number(answer.awardedPoints || 0)} pts)`}
                  </span>
                )}
              </div>

              {answer.isCorrect === null && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <button
                    onClick={() => onMarkAnswer(answer.id, answer.userId, true)}
                    className="btn btn-secondary"
                  >
                    Correct
                  </button>
                  <button
                    onClick={() => onMarkAnswer(answer.id, answer.userId, false)}
                    className="btn btn-danger"
                  >
                    Incorrect
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AnswerList;
