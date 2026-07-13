interface LoadingSpinnerProps {
  text?: string;
}

function LoadingSpinner({
  text = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

export default LoadingSpinner;