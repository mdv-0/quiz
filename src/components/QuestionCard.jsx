import MediaDisplay from './MediaDisplay';

const QuestionCard = ({
  question,
  questionNumber,
  factStage = 1,
  mediaMode = 'default',
  mediaPlaybackState = 'completed',
  canControlMedia = false,
  onStartMedia = null,
  onMediaCompleted = null,
}) => {
  if (!question) return null;
  const questionRound = Number(question.round || 1);

  return (
    <section className="glass-card p-6 sm:p-8 w-full">
      <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl sm:text-3xl font-bold">Question {questionNumber}</h2>
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral">Round {questionRound}</span>
          <span className="badge badge-neutral">{question.timeLimitSec || 30}s</span>
          <span className="badge badge-brand">{question.mediaType || 'text'}</span>
        </div>
      </div>

      <MediaDisplay
        mediaType={question.mediaType}
        mediaUrl={question.mediaUrl}
        text={question.text}
        question={question}
        factStage={factStage}
        mediaMode={mediaMode}
        mediaPlaybackState={mediaPlaybackState}
        canControlMedia={canControlMedia}
        onStartMedia={onStartMedia}
        onMediaCompleted={onMediaCompleted}
      />
    </section>
  );
};

export default QuestionCard;
