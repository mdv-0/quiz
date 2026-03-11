import { useEffect, useRef, useState } from 'react';

const Placeholder = ({ label }) => (
  <div className="w-full h-56 sm:h-72 rounded-xl border border-[#654a9e] bg-[#1a1230] flex items-center justify-center">
    <p className="text-muted font-medium">{label}</p>
  </div>
);

const deriveFacts = (text) => {
  if (!text) return [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 3) return lines.slice(0, 3);

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);
  if (sentences.length >= 3) return sentences.slice(0, 3);

  if (sentences.length === 2) return [sentences[0], sentences[1], 'Последний факт будет открыт ведущим.'];
  if (sentences.length === 1) return [sentences[0], 'Второй факт будет открыт ведущим.', 'Третий факт будет открыт ведущим.'];
  return [];
};

const getDisplayText = (question, text, factStage) => {
  const isRound4 = Number(question?.round) === 4;
  if (!isRound4) {
    return text;
  }

  const facts = Array.isArray(question?.facts) && question.facts.length > 0
    ? question.facts
    : deriveFacts(text);
  const stage = Math.max(1, Math.min(3, Number(factStage || 1)));
  return facts.slice(0, stage).map((fact, idx) => `Факт ${idx + 1}: ${fact}`).join('\n\n');
};

const MediaDisplay = ({
  mediaType,
  mediaUrl,
  text,
  question,
  factStage = 1,
  mediaMode = 'default',
  mediaPlaybackState = 'completed',
  canControlMedia = false,
  onStartMedia = null,
  onMediaCompleted = null,
}) => {
  const displayText = getDisplayText(question, text, factStage);
  const mediaRef = useRef(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const isManagedMode = mediaMode === 'quiz';
  const isTimedMedia = mediaType === 'video' || mediaType === 'audio';
  const shouldManageFlow = isManagedMode && isTimedMedia;
  const isPending = shouldManageFlow && mediaPlaybackState === 'pending';
  const isPlaying = shouldManageFlow && mediaPlaybackState === 'playing';
  const isCompleted = shouldManageFlow && mediaPlaybackState === 'completed';
  const mediaKey = `${question?.docId || question?.id || 'question'}:${mediaType}:${mediaUrl || ''}`;

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement || !shouldManageFlow || !isPlaying) {
      return;
    }

    mediaElement.currentTime = 0;
    const playPromise = mediaElement.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setAutoplayBlocked(true);
      });
    }
  }, [shouldManageFlow, isPlaying, mediaKey]);

  useEffect(() => {
    setAutoplayBlocked(false);
  }, [mediaKey]);

  const handlePause = () => {
    if (!shouldManageFlow || !isPlaying || !mediaRef.current) {
      return;
    }
    if (mediaRef.current.ended) {
      return;
    }
    mediaRef.current.play().catch(() => {});
  };

  const handleEnded = () => {
    if (!shouldManageFlow || !isPlaying || typeof onMediaCompleted !== 'function') {
      return;
    }
    onMediaCompleted();
  };

  const buildMediaControls = () => {
    if (!shouldManageFlow) {
      return true;
    }
    return false;
  };

  if (mediaType === 'text' || !mediaType) {
    return (
      <div className="rounded-xl bg-[#1d1436] border border-[#634997] p-6 sm:p-8 text-center">
        <p className="text-2xl sm:text-3xl font-semibold leading-relaxed whitespace-pre-line">{displayText}</p>
      </div>
    );
  }

  if (mediaType === 'image') {
    return (
      <div className="space-y-4">
        {mediaUrl ? (
          <img src={mediaUrl} alt="Question" className="max-w-full max-h-96 rounded-xl shadow-md object-contain mx-auto" />
        ) : (
          <Placeholder label="Image placeholder" />
        )}
        {displayText && <p className="text-xl font-semibold text-center whitespace-pre-line">{displayText}</p>}
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="space-y-4">
        {mediaUrl ? (
          <>
            {isPending && (
              <div className="rounded-xl border border-[#7354b3] bg-[#1a1230] p-6 text-center space-y-4">
                <p className="text-lg font-semibold">Видео готово к запуску</p>
                {canControlMedia ? (
                  <button type="button" onClick={onStartMedia} className="btn btn-primary">
                    Start Video
                  </button>
                ) : (
                  <p className="text-muted">Ожидаем старт от ведущего...</p>
                )}
              </div>
            )}

            {(isPlaying || isCompleted || !shouldManageFlow) && (
              <div className="space-y-3">
                <video
                  key={mediaKey}
                  ref={mediaRef}
                  controls={buildMediaControls()}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  controlsList={shouldManageFlow ? 'nodownload noplaybackrate nofullscreen' : undefined}
                  className="max-w-full max-h-96 rounded-xl shadow-md mx-auto"
                  src={mediaUrl}
                >
                  Your browser does not support the video tag.
                </video>
                {autoplayBlocked && isPlaying && (
                  <p className="text-center text-sm text-muted">Если видео не стартовало автоматически, нажмите Play один раз.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <Placeholder label="Video placeholder" />
        )}
        {displayText && <p className="text-xl font-semibold text-center whitespace-pre-line">{displayText}</p>}
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <div className="space-y-4">
        {mediaUrl ? (
          <>
            {isPending && (
              <div className="rounded-xl border border-[#7354b3] bg-[#1a1230] p-6 text-center space-y-4">
                <p className="text-lg font-semibold">Аудио готово к запуску</p>
                {canControlMedia ? (
                  <button type="button" onClick={onStartMedia} className="btn btn-primary">
                    Start Audio
                  </button>
                ) : (
                  <p className="text-muted">Ожидаем старт от ведущего...</p>
                )}
              </div>
            )}

            {(isPlaying || isCompleted || !shouldManageFlow) && (
              <div className="space-y-3">
                <audio
                  key={mediaKey}
                  ref={mediaRef}
                  controls={buildMediaControls()}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  controlsList={shouldManageFlow ? 'nodownload noplaybackrate' : undefined}
                  className="w-full"
                  src={mediaUrl}
                >
                  Your browser does not support the audio tag.
                </audio>
                {autoplayBlocked && isPlaying && (
                  <p className="text-center text-sm text-muted">Если аудио не стартовало автоматически, нажмите Play один раз.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <Placeholder label="Audio placeholder" />
        )}
        {displayText && <p className="text-xl font-semibold text-center whitespace-pre-line">{displayText}</p>}
      </div>
    );
  }

  return null;
};

export default MediaDisplay;
