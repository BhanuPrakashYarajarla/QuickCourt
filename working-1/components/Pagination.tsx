'use client';
import { useState } from 'react';

export default function Pagination() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const getVisiblePages = () => {
    const pages = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <nav className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                currentPage === 1
                  ? 'bg-[#DDD0C8]/50 text-[#323232]/50 cursor-not-allowed'
                  : 'bg-[#DDD0C8] text-[#323232] hover:bg-[#323232] hover:text-[#DDD0C8] border-2 border-transparent hover:border-[#323232]'
              }`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-arrow-left-s-line"></i>
              </div>
            </button>

            {/* Page Numbers */}
            {getVisiblePages().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-[#323232]/60 font-medium">...</span>
                ) : (
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer min-w-[40px] ${
                      currentPage === page
                        ? 'bg-[#323232] text-[#DDD0C8]'
                        : 'bg-[#DDD0C8] text-[#323232] hover:bg-[#323232] hover:text-[#DDD0C8] border-2 border-transparent hover:border-[#323232]'
                    }`}
                    onClick={() => handlePageChange(page as number)}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}

            {/* Next Button */}
            <button
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-[#DDD0C8]/50 text-[#323232]/50 cursor-not-allowed'
                  : 'bg-[#DDD0C8] text-[#323232] hover:bg-[#323232] hover:text-[#DDD0C8] border-2 border-transparent hover:border-[#323232]'
              }`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-arrow-right-s-line"></i>
              </div>
            </button>
          </nav>
        </div>

        {/* Page Info */}
        <div className="text-center mt-4">
          <p className="text-sm text-[#323232]/70">
            Showing page {currentPage} of {totalPages} ({((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, 96)} of 96 venues)
          </p>
        </div>
      </div>
    </section>
  );
}