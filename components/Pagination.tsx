import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // 끝에서 시작 위치 조정
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
          currentPage === 1
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        이전
      </button>

      {/* 페이지 번호들 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
            page === currentPage
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
          currentPage === totalPages
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        다음
      </button>
    </div>
  );
};

export default Pagination;
