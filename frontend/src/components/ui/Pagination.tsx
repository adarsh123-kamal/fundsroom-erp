interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="pagination">
      <span>
        Showing {start}–{end} of {total} results
      </span>
      <div className="pagination-buttons">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              className={`pagination-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
