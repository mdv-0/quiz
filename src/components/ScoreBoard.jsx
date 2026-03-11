const ScoreBoard = ({ users, currentUserId = null }) => {
  if (!users || users.length === 0) {
    return (
      <section className="glass-card p-5 sm:p-6">
        <h2 className="text-2xl font-bold mb-3">Scoreboard</h2>
        <p className="text-muted">No participants yet</p>
      </section>
    );
  }

  const maxScore = Math.max(...users.map((user) => Number(user.score || 0)));

  return (
    <section className="glass-card p-5 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">Scoreboard</h2>

      <div className="space-y-2.5">
        {users.map((user, index) => {
          const isWinner = Number(user.score || 0) === maxScore;
          return (
          <article
            key={user.id}
            className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
              isWinner
                ? 'bg-[#4a3a1a] border-[#e0b85f]'
                : 'bg-[#26193f] border-[#5f4695]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm shrink-0 ${
                  isWinner
                    ? 'bg-[#e0b85f] text-[#2f1f00]'
                    : 'bg-[#5e4298] text-[#f6efff]'
                }`}
              >
                {index + 1}
              </span>
              <span className="font-semibold truncate">{user.name}</span>
              {isWinner && <span className="badge bg-[#e0b85f] text-[#2f1f00]">Winner</span>}
              {user.id === currentUserId && <span className="badge badge-neutral">You</span>}
            </div>

            <p className="font-bold text-lg shrink-0">{user.score} pts</p>
          </article>
          );
        })}
      </div>
    </section>
  );
};

export default ScoreBoard;
