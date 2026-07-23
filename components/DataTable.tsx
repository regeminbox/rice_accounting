
import React, { useState } from 'react';
import { SaleRecord, OrderStatus } from '../types';
import { ICONS } from '../constants';
import { Bot, Printer, FileDown, FileUp } from 'lucide-react';
import Pagination from './Pagination';
import { printSalesReport } from '../utils/printService';
import { format } from 'date-fns';

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

interface DataTableProps {
  data: SaleRecord[];
  onRowClick?: (record: SaleRecord) => void;
  onAddClick?: () => void;
  onImportClick?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportClick?: () => void;
  onEditClick?: (record: SaleRecord) => void;
  onDeleteClick?: (record: SaleRecord) => void;
  showPagination?: boolean; // 페이지네이션 표시 여부
  itemsPerPage?: number; // 페이지당 항목 수
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  onRowClick,
  onAddClick,
  onImportClick,
  onExportClick,
  onEditClick,
  onDeleteClick,
  showPagination = true,
  itemsPerPage = 10
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');

  const filteredData = data.filter(item => {
    // 텍스트 검색 필터
    const matchesSearch = item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase());

    // 날짜 필터
    let matchesDate = true;
    if (startDate && endDate) {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDate = itemDate >= start && itemDate <= end;
    }

    // 상태 필터
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  }).sort((a, b) => {
    switch (sortKey) {
      case 'date_asc': return a.date.localeCompare(b.date);
      case 'amount_desc': return b.totalAmount - a.totalAmount;
      case 'amount_asc': return a.totalAmount - b.totalAmount;
      case 'date_desc':
      default: return b.date.localeCompare(a.date);
    }
  });

  // 요약 통계
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = data.filter(item => item.date === today).length;
  const filteredTotal = filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const filteredUnpaid = filteredData
    .filter(item => item.status === OrderStatus.UNPAID)
    .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const handlePrint = () => {
    const periodLabel = startDate && endDate ? `${startDate} ~ ${endDate}` : '전체 기간';
    const statusLabel = statusFilter === 'all' ? '' : ` (${statusFilter})`;
    printSalesReport(filteredData, {
      title: `판매 내역${statusLabel}`,
      periodLabel
    });
  };

  // 검색어 변경 시 페이지를 1로 리셋
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // 날짜 필터 변경 시 페이지를 1로 리셋
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = showPagination ? filteredData.slice(startIndex, endIndex) : filteredData;

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderStatus.UNPAID:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case OrderStatus.DELIVERING:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case OrderStatus.COMPLETED:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  // Fix: Added Bot import to resolve missing component error
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <Bot size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">기록된 판매 내역이 없습니다</h3>
        <p className="text-slate-500 text-center max-w-sm mb-8">
          AI가 데이터를 분석할 수 있도록 엑셀 파일을 업로드하거나 <br/>
          아래 커맨드 센터를 통해 판매 내역을 입력해주세요.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAddClick}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            {ICONS.Plus} 데이터 직접 입력
          </button>
          <label className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer">
            {ICONS.Download} 엑셀 불러오기
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onImportClick}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Header / Filter */}
      <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              {ICONS.Search}
            </div>
            <input
              type="text"
              placeholder="거래처, 품종으로 검색"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
              title="현재 필터된 판매 내역을 인쇄합니다"
            >
              <Printer size={16} /> <span>인쇄</span>
            </button>
            {onExportClick && (
              <button
                onClick={onExportClick}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                title="판매 내역을 엑셀 파일로 저장합니다"
              >
                <FileDown size={16} /> <span>엑셀 내보내기</span>
              </button>
            )}
            {onImportClick && (
              <label
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
                title="엑셀 파일에서 판매 내역을 가져옵니다"
              >
                <FileUp size={16} /> <span>엑셀 가져오기</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onImportClick}
                  className="hidden"
                />
              </label>
            )}
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-all shadow-md shadow-sky-100"
            >
              {ICONS.Plus} <span>신규 판매</span>
            </button>
          </div>
        </div>

        {/* 날짜/상태/정렬 필터 */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-600">날짜 필터:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, endDate)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange(startDate, e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => handleDateChange('', '')}
              className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
            >
              초기화
            </button>
          )}

          <span className="text-xs font-bold text-slate-600 ml-2">상태:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | OrderStatus);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="all">전체</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-600 ml-2">정렬:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="date_desc">최신순</option>
            <option value="date_asc">오래된순</option>
            <option value="amount_desc">금액 높은순</option>
            <option value="amount_asc">금액 낮은순</option>
          </select>
        </div>

        {/* 요약 바 */}
        <div className="flex items-center gap-4 mt-3 px-3 py-2 bg-sky-50/50 border border-sky-100 rounded-xl text-xs font-bold flex-wrap">
          <span className="text-sky-700">오늘 {todayCount}건</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">조회 결과 {filteredData.length}건</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">합계 {filteredTotal.toLocaleString()}원</span>
          <span className="text-slate-300">|</span>
          <span className="text-rose-600">미결제 {filteredUnpaid.toLocaleString()}원</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-16 text-center">번호</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">일자</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">거래처</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">합계 금액</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">상태</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id}
                className={`group transition-colors ${
                  row.status === OrderStatus.UNPAID ? 'bg-rose-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-4 text-sm text-slate-400 font-medium text-center">
                  {(showPagination ? startIndex : 0) + idx + 1}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.date}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-800">{row.customerName}</div>
                  {(row as any).isMultiItem && (row as any).items ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {(row as any).items.map((item: any, idx: number) => (
                        <div key={idx}>
                          {item.product_name} {item.quantity}개 × {item.unit_price.toLocaleString()}원
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-slate-500">
                      {row.productName} {row.quantity}개
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 font-mono">
                  {row.totalAmount.toLocaleString()}원
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick?.(row);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      {ICONS.Edit}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick?.(row);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      {ICONS.Delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-4 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Table Footer */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          총 {filteredData.length}건의 데이터 {showPagination && totalPages > 1 && `(페이지 ${currentPage}/${totalPages})`}
        </span>
      </div>
    </div>
  );
};

export default DataTable;