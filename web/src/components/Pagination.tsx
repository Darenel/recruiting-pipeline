type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const displayPage = page + 1;
  const start = total === 0 ? 0 : page * limit + 1;
  const end = Math.min(total, (page + 1) * limit);

  return (
    <div className="pagination">
      <span>
        {start}-{end} of {total}
      </span>
      <div className="pagination-controls">
        <button className="ghost" disabled={page <= 0} onClick={() => onPageChange(page - 1)} type="button">
          Previous
        </button>
        <span>
          Page {displayPage} of {totalPages}
        </span>
        <button className="ghost" disabled={displayPage >= totalPages} onClick={() => onPageChange(page + 1)} type="button">
          Next
        </button>
      </div>
    </div>
  );
}
