const ScoreBoard = ({ users, currentUserId = null }) => {
  if (!users || users.length === 0) {
    return (
      <section className="glass-card p-5 sm:p-6">
        <h2 className="text-2xl font-bold mb-3">Scoreboard</h2>
        <p className="text-muted">No participants yet</p>
      </section>
    );
  }

  return (
    <section className="glass-card p-5 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">Scoreboard</h2>

      <div className="space-y-2.5">
        {users.map((user, index) => (
          <article
            key={user.id}
            className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
              user.id === currentUserId
                ? 'bg-[#3a2867] border-[#8e5bff]'
                : 'bg-[#26193f] border-[#5f4695]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5e4298] text-[#f6efff] font-bold text-sm shrink-0">
                {index + 1}
              </span>
              <span className="font-semibold truncate">{user.name}</span>
              {user.id === currentUserId && <span className="badge badge-neutral">You</span>}
            </div>

            <p className="font-bold text-lg shrink-0">{user.score} pts</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScoreBoard;
