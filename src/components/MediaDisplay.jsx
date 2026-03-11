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

const MediaDisplay = ({ mediaType, mediaUrl, text, question, factStage = 1 }) => {
  const displayText = getDisplayText(question, text, factStage);

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
          <video controls className="max-w-full max-h-96 rounded-xl shadow-md mx-auto" src={mediaUrl}>
            Your browser does not support the video tag.
          </video>
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
          <audio controls className="w-full">
            <source src={mediaUrl} />
            Your browser does not support the audio tag.
          </audio>
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
