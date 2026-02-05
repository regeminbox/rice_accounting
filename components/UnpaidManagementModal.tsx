import React, { useState, useEffect } from 'react';
import { getAllSales, getAllCustomers, recordPayment, getPaymentHistory } from '../services/database';
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

  // 부분 수금 폼 상태: { saleId: { amount, date } }
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  // 수금 이력 캐시: { saleId: [...] }
  const [paymentHistoryCache, setPaymentHistoryCache] = useState<{ [key: string]: any[] }>({});

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

  // 행 클릭 시 수금 폼 토글 및 수금 이력 로드
  const handleToggleExpand = async (saleId: string) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }
    setExpandedSaleId(saleId);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);

    // 수금 이력 로드 (캐시 없으면)
    if (!paymentHistoryCache[saleId]) {
      const history = await getPaymentHistory(saleId) as any[];
      setPaymentHistoryCache(prev => ({ ...prev, [saleId]: history }));
    }
  };

  // 부분 수금 처리
  const handleRecordPayment = async (saleId: string) => {
    const amount = parseInt(paymentAmount.replace(/[^0-9]/g, '')) || 0;
    if (amount <= 0) {
      alert('수금 금액을 입력해주세요.');
      return;
    }
    if (!paymentDate) {
      alert('수금 날짜를 입력해주세요.');
      return;
    }

    try {
      const result = await recordPayment(saleId, amount, paymentDate);

      // 캐시 갱신
      const history = await getPaymentHistory(saleId) as any[];
      setPaymentHistoryCache(prev => ({ ...prev, [saleId]: history }));

      if (result.remaining <= 0) {
        alert('결제가 완료되었습니다.');
        setExpandedSaleId(null);
      } else {
        alert(`${amount.toLocaleString()}원 수금 완료.\n남은 미수금: ${result.remaining.toLocaleString()}원`);
        setPaymentAmount('');
      }

      await loadData();
      await onUpdate();
    } catch (error: any) {
      alert(`수금 실패: ${error.message}`);
    }
  };

  // 필터링
  const filteredSales = unpaidSales.filter(sale => {
    const matchesSearch = searchQuery === '' ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const totalUnpaid = filteredSales.reduce((sum, sale) => sum + ((sale.total_amount || 0) - (sale.paid_amount || 0)), 0);

  // 남은 미수금 계산
  const getRemainingAmount = (sale: any) => (sale.total_amount || 0) - (sale.paid_amount || 0);

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
                    원금 / 남은금액
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    수금
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSales.map((sale) => {
                  const remaining = getRemainingAmount(sale);
                  const isExpanded = expandedSaleId === sale.id;
                  const history = paymentHistoryCache[sale.id] || [];

                  return (
                    <React.Fragment key={sale.id}>
                      {/* 메인 행 */}
                      <tr className={`transition-colors ${isExpanded ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
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
                              {sale.product_name} {sale.quantity}{sale.unit || '포'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs text-slate-400">
                            원금: {(sale.total_amount || 0).toLocaleString()}원
                          </div>
                          <div className="font-bold text-rose-600">
                            남은: {remaining.toLocaleString()}원
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleToggleExpand(sale.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${
                                isExpanded
                                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {isExpanded ? '접기' : '수금'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 펼쳐진 수금 폼 + 이력 */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-rose-50 border-t border-rose-100">
                            {/* 수금 입력 폼 */}
                            <div className="flex items-end gap-3 mb-4">
                              <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1">수금 금액 (원)</label>
                                <input
                                  type="text"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  placeholder={`최대 ${remaining.toLocaleString()}원`}
                                  autoFocus
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                              </div>
                              <div className="w-44">
                                <label className="block text-xs font-bold text-slate-600 mb-1">수금 날짜</label>
                                <input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                              </div>
                              <button
                                onClick={() => handleRecordPayment(sale.id)}
                                className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap"
                              >
                                저장
                              </button>
                            </div>

                            {/* 기존 수금 이력 */}
                            {history.length > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-500 mb-2">수금 이력</div>
                                <div className="space-y-1">
                                  {history.map((h: any) => (
                                    <div key={h.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                                      <span className="text-xs text-slate-500">{h.date}</span>
                                      <span className="text-sm font-bold text-emerald-600">{h.amount.toLocaleString()}원</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-200">
                                  <span className="text-xs font-bold text-slate-600">누적 수금</span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {history.reduce((sum: number, h: any) => sum + h.amount, 0).toLocaleString()}원
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
