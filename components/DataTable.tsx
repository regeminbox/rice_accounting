
import React, { useState } from 'react';
import { SaleRecord, OrderStatus } from '../types';
import { ICONS } from '../constants';
import { Bot } from 'lucide-react';

interface DataTableProps {
  data: SaleRecord[];
  onRowClick?: (record: SaleRecord) => void;
  onAddClick?: () => void;
  onImportClick?: () => void;
  onEditClick?: (record: SaleRecord) => void;
  onDeleteClick?: (record: SaleRecord) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onRowClick, onAddClick, onImportClick, onEditClick, onDeleteClick }) => {
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(item => 
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.productName.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white sticky top-0 z-10">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            {ICONS.Search}
          </div>
          <input
            type="text"
            placeholder="거래처, 품종, 날짜로 검색 (Ctrl + F)"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors">
            {ICONS.Filter}
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-all shadow-md shadow-sky-100"
          >
            {ICONS.Plus} <span>신규 판매</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">일자</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">거래처</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">품종/제품</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">수량</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">단가</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">합계 금액</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">상태</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((row) => (
              <tr
                key={row.id}
                className={`group transition-colors ${
                  row.status === OrderStatus.UNPAID ? 'bg-rose-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.date}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.customerName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[11px] font-bold mr-2">쌀</span>
                  {row.productName}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{row.quantity}포</td>
                <td className="px-6 py-4 text-sm text-slate-400 font-mono">{row.unitPrice.toLocaleString()}원</td>
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
      
      {/* Table Footer */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">총 {filteredData.length}건의 데이터</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white transition-colors">이전</button>
          <button className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white transition-colors">1</button>
          <button className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white transition-colors">다음</button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;