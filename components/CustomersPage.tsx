
import React, { useState, useEffect } from 'react';
import { getAllCustomers, getAllSales, resetAllBalances } from '../services/database';
import { ICONS } from '../constants';
import EditCustomerModal from './EditCustomerModal';
import Pagination from './Pagination';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '1year' | '3years' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailStartDate, setDetailStartDate] = useState('');
  const [detailEndDate, setDetailEndDate] = useState('');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const customersData = await getAllCustomers() as any[];
    const salesData = await getAllSales() as any[];

    setCustomers(customersData);
    setSales(salesData);
    setIsLoading(false);
  };

  const handleResetBalances = async () => {
    if (!confirm('모든 판매 기록을 기반으로 미수금을 재계산하시겠습니까?\n미결제 상태인 판매 기록만 합산하여 정확한 미수금을 계산합니다.')) {
      return;
    }

    try {
      await resetAllBalances();
      alert('모든 미수금이 재계산되었습니다.');
      await loadData();
    } catch (error: any) {
      alert(`재계산 실패: ${error.message}`);
    }
  };

  const filterSalesByPeriod = (salesData: any[]) => {
    if (selectedPeriod === 'all') return salesData;

    const now = new Date();
    const cutoffDate = new Date();

    if (selectedPeriod === '1month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (selectedPeriod === '1year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    } else if (selectedPeriod === '3years') {
      cutoffDate.setFullYear(now.getFullYear() - 3);
    }

    return salesData.filter(sale => {
      if (!sale.date) return true; // Include sales without dates
      const saleDate = new Date(sale.date);
      return saleDate >= cutoffDate;
    });
  };

  const getCustomerStats = (customerId: string, usePeriodFilter = false, useDetailDateFilter = false) => {
    let customerSales = sales.filter(s => s.customer_id === customerId);

    if (usePeriodFilter) {
      customerSales = filterSalesByPeriod(customerSales);
    }

    // 상세 모달 날짜 필터
    if (useDetailDateFilter && detailStartDate && detailEndDate) {
      customerSales = customerSales.filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date);
        const start = new Date(detailStartDate);
        const end = new Date(detailEndDate);
        return saleDate >= start && saleDate <= end;
      });
    }

    const totalSales = customerSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalOrders = customerSales.length;
    const unpaidSales = customerSales.filter(s => s.status === '미결제');
    const unpaidAmount = unpaidSales.reduce((sum, s) => sum + s.total_amount, 0);

    return {
      totalSales,
      totalOrders,
      unpaidAmount,
      recentSales: customerSales.slice(0, 5),
      allSales: customerSales
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 검색 및 필터링
  const filteredCustomers = customers.filter(customer => {
    const stats = getCustomerStats(customer.id, selectedPeriod !== 'all');

    // 기간 필터링 (선택된 기간에 주문이 없으면 제외)
    if (selectedPeriod !== 'all' && stats.totalOrders === 0) {
      return false;
    }

    // 검색 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        (customer.contact || '').toLowerCase().includes(query) ||
        (customer.address || '').toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 검색어 변경 시 페이지를 1로 리셋
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const totalUnpaid = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalCustomers = customers.length;
  const customersWithDebt = customers.filter(c => (c.balance || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-xl">거래처 관리</h3>
          <p className="text-sm text-slate-500 mt-1">
            총 {totalCustomers}개 거래처
          </p>
        </div>
        <button
          onClick={handleResetBalances}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-emerald-600 transition-all"
        >
          {ICONS.Trending} 미수금 재계산
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-700 mb-1">기간별 매출 통계</h4>
            <p className="text-xs text-slate-500">조회 기간을 선택하여 통계를 확인하세요</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('1month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === '1month'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1개월
            </button>
            <button
              onClick={() => setSelectedPeriod('1year')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === '1year'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1년
            </button>
            <button
              onClick={() => setSelectedPeriod('3years')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === '3years'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3년
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              {ICONS.Customers}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedPeriod === 'all' ? '총 거래처' : '기간 내 거래처'}
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">
            {selectedPeriod === 'all'
              ? `${totalCustomers}개`
              : `${customers.filter(c => {
                  const customerSales = filterSalesByPeriod(sales.filter(s => s.customer_id === c.id));
                  return customerSales.length > 0;
                }).length}개`
            }
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              {ICONS.Trending}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedPeriod === 'all' ? '총 매출액' : '기간 매출액'}
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {filterSalesByPeriod(sales).reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}원
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              {ICONS.Alert}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedPeriod === 'all' ? '총 미수금' : '기간 미수금'}
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">
            {filterSalesByPeriod(sales).filter(s => s.status === '미결제').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}원
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">거래처 목록</h3>

          {/* 검색 입력 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              {ICONS.Search}
            </div>
            <input
              type="text"
              placeholder="거래처명, 연락처, 주소 검색..."
              className="pl-10 pr-4 py-2 w-80 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  거래처명
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  총 거래액
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  미수금
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  주문 수
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map((customer) => {
                const stats = getCustomerStats(customer.id, selectedPeriod !== 'all');

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.contact || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.address || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-800">
                        {stats.totalSales.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${
                        stats.unpaidAmount > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {stats.unpaidAmount.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold">
                        {stats.totalOrders}건
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(
                            selectedCustomer === customer.id ? null : customer.id
                          )}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          {selectedCustomer === customer.id ? '닫기' : '상세'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 pb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            총 {filteredCustomers.length}개 거래처 {totalPages > 1 && `(페이지 ${currentPage}/${totalPages})`}
          </span>
        </div>

        {customers.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            등록된 거래처가 없습니다.
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={loadData}
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (() => {
        const customer = customers.find(c => c.id === selectedCustomer);
        const hasDateFilter = detailStartDate && detailEndDate;
        const stats = getCustomerStats(selectedCustomer, false, hasDateFilter);

        return (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-xl">{customer?.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  거래 상세 내역
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setDetailStartDate('');
                  setDetailEndDate('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 기간 필터 */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-slate-700">기간 선택:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={detailStartDate}
                    onChange={(e) => setDetailStartDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-slate-500">~</span>
                  <input
                    type="date"
                    value={detailEndDate}
                    onChange={(e) => setDetailEndDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                  {hasDateFilter && (
                    <button
                      onClick={() => {
                        setDetailStartDate('');
                        setDetailEndDate('');
                      }}
                      className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-4">
                <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">
                  {hasDateFilter ? '기간 거래액' : '총 거래액'}
                </div>
                <div className="text-2xl font-black text-sky-700">
                  {stats.totalSales.toLocaleString()}원
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4">
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                  {hasDateFilter ? '기간 미수금' : '총 미수금'}
                </div>
                <div className="text-2xl font-black text-rose-700">
                  {stats.unpaidAmount.toLocaleString()}원
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  {hasDateFilter ? '기간 주문' : '총 주문'}
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {stats.totalOrders}건
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 mb-4">최근 거래 내역</h4>
              <div className="space-y-2">
                {stats.recentSales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-1">
                      {sale.is_multi_item && sale.items ? (
                        <>
                          <div className="font-bold text-slate-800">다품종 주문</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {sale.items.map((item: any, idx: number) => (
                              <div key={idx}>
                                • {item.product_name} {item.quantity}{item.unit || '개'} × {item.unit_price.toLocaleString()}원
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-800">{sale.product_name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {sale.quantity}포 × {sale.unit_price?.toLocaleString() || 0}원
                          </div>
                        </>
                      )}
                      <div className="text-xs text-slate-400 mt-1">{sale.date}</div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-slate-600">
                        합계: {sale.total_amount.toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        sale.status === '결제완료'
                          ? 'bg-emerald-50 text-emerald-600'
                          : sale.status === '미결제'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.recentSales.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    거래 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomersPage;
