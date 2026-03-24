export function ProductGridSkeleton({ count = 3 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton skeleton-card" key={`skeleton-card-${index}`} />
      ))}
    </div>
  );
}

export function LineSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-group">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton skeleton-line" key={`skeleton-line-${index}`} />
      ))}
    </div>
  );
}
