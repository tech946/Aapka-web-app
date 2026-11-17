interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className='table_pagination'>
      <div className='pagination_info'>
        Page {page} of {totalPages} · {total} total
      </div>
      <div className='pagination_controls'>
        <button type='button' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button type='button' disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
