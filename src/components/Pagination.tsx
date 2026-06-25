interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Seiten" className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Vorherige Seite"
        className="px-3 py-2 text-ink rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ←
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`px-3 py-2 rounded font-medium ${
            page === currentPage ? 'bg-brand text-white' : 'text-ink hover:bg-surface'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Nächste Seite"
        className="px-3 py-2 text-ink rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
      >
        →
      </button>
    </nav>
  );
}
