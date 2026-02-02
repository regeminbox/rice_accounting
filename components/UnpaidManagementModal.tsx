import React, { useState, useEffect } from 'react';
import { getAllSales, updateSale, getAllCustomers } from '../services/database';
import { ICONS } from '../constants';
import Pagination from './Pagination';
import { closeModalWithFocusRestore } from '../utils/focusHelper';

interface UnpaidManagementModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

const UnpaidManagementModal: React.FC<UnpaidManagementModalProps> = ({ onClose, onUpdate }) => {
  const [unpaidSales, setUnpaidSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const salesData = await getAllSales() as any[];
    const customersData = await getAllCustomers() as any[];

    // 미결제 상태인 판매만 필터링
    const unpaid = salesData.filter(sale => sale.status === '미결제');

    setUnpaidSales(unpaid);
    setCustomers(customersData);
    setIsLoading(false);
  };

  const handleStatusChange = async (saleId: string, newStatus: string) => {
    try {
      await updateSale(saleId, { status: newStatus });
      alert(`상태가 "${newStatus}"(으)로 변경되었습니다.`);
      await loadData();
      await onUpdate();
    } catch (error: any) {
      alert(`상태 변경 실패: ${error.message}`);
    }
  };

  // 필터링
  const filteredSales = unpaidSales.filter(sale => {
    // 텍스트 검색
    const matchesSearch = searchQuery === '' ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

    // 날짜 필터
    let matchesDate = true;
    if (startDate && endDate) {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDate = saleDate >= start && saleDate <= end;
    }

    return matchesSearch && matchesDate;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 검색/필터 변경 시 1페이지로
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const totalUnpaid = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Alert}
              </div>
              <div>
                <h2 className="text-2xl font-bold">미수금 관리</h2>
                <p className="text-sm text-white/80 mt-1">
                  미결제 상태인 판매 내역을 관리합니다
                </p>
              </div>
            </div>
            <button
              onClick={() => closeModalWithFocusRestore(onClose)}
              className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50">
          {/* 통계 */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-200">
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              필터링된 총 미수금
            </div>
            <div className="text-3xl font-black text-rose-700">
              {totalUnpaid.toLocaleString()}원
            </div>
            <div className="text-xs text-rose-600 mt-1">
              총 {filteredSales.length}건의 미결제 주문
            </div>
          </div>

          {/* 검색 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                {ICONS.Search}
              </div>
              <input
                type="text"
                placeholder="거래처명으로 검색..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">날짜 필터:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, endDate)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange(startDate, e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => handleDateChange('', '')}
                className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">데이터를 불러오는 중...</div>
            </div>
          ) : paginatedSales.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-slate-600 font-bold">미수금이 없습니다!</div>
                <div className="text-sm text-slate-400 mt-2">모든 주문이 결제 완료되었습니다.</div>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    거래처
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    품목
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    상태 변경
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sale.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{sale.customer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {sale.is_multi_item && sale.items ? (
                        <div className="text-xs text-slate-600">
                          {sale.items.map((item: any, idx: number) => (
                            <div key={idx}>
                              • {item.product_name} {item.quantity}{item.unit || '개'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-700">
                          {sale.product_name} {sale.quantity}포
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-rose-600">
                        {sale.total_amount.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleStatusChange(sale.id, '결제완료')}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                          결제완료
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            총 {filteredSales.length}건의 미결제 주문 {totalPages > 1 && `(페이지 ${currentPage}/${totalPages})`}
          </span>
          <button
            onClick={() => closeModalWithFocusRestore(onClose)}
            className="px-4 py-2 bg-slate-600 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnpaidManagementModal;
