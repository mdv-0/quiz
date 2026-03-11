const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="page-shell">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-[#5d458f] border-t-[#c553ff] animate-spin" />
        <p className="mt-5 text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
