const Placeholder = ({ label }) => (
  <div className="w-full h-56 sm:h-72 rounded-xl border border-[#654a9e] bg-[#1a1230] flex items-center justify-center">
    <p className="text-muted font-medium">{label}</p>
  </div>
);

const MediaDisplay = ({ mediaType, mediaUrl, text }) => {
  if (mediaType === 'text' || !mediaType) {
    return (
      <div className="rounded-xl bg-[#1d1436] border border-[#634997] p-6 sm:p-8 text-center">
        <p className="text-2xl sm:text-3xl font-semibold leading-relaxed">{text}</p>
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
        {text && <p className="text-xl font-semibold text-center">{text}</p>}
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
        {text && <p className="text-xl font-semibold text-center">{text}</p>}
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
        {text && <p className="text-xl font-semibold text-center">{text}</p>}
      </div>
    );
  }

  return null;
};

export default MediaDisplay;
