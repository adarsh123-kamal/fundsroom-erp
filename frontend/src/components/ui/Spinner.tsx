export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="loading-spinner"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="loading-center">
      <Spinner size={32} />
    </div>
  );
}
