
import React, { useState, useEffect } from 'react';
import { getInventoryTransactionsByProduct } from '../services/database';
import { ICONS } from '../constants';
import AddInventoryTransactionModal from './AddInventoryTransactionModal';
import EditInventoryTransactionModal from './EditInventoryTransactionModal';

interface InventoryDetailModalProps {
  product: any;
  onClose: () => void;
  onUpdate: () => void;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ product, onClose, onUpdate }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, [product.id]);

  const loadTransactions = async () => {
    setIsLoading(true);
    const data = await getInventoryTransactionsByProduct(product.id) as any[];
    setTransactions(data);
    setIsLoading(false);
  };

  const handleTransactionAdded = async () => {
    await loadTransactions();
    await onUpdate();
  };

  // 통계 계산
  const stats = {
    totalIn: transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0),
    totalOut: transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0),
    totalInCost: transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.total_cost, 0),
    avgInPrice: transactions.filter(t => t.type === 'in').length > 0
      ? transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.unit_price, 0) / transactions.filter(t => t.type === 'in').length
      : 0,
    inCount: transactions.filter(t => t.type === 'in').length,
    outCount: transactions.filter(t => t.type === 'out').length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{product.name} 재고 상세</h2>
              <p className="text-sm text-white/80 mt-1">입출고 이력 및 재고 관리</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                현재 재고
              </div>
              <div className="text-2xl font-black text-slate-800">
                {product.stock}{product.unit || '포'}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                총 입고량
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {stats.totalIn}{product.unit || '포'}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stats.inCount}회</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                총 출고량
              </div>
              <div className="text-2xl font-black text-rose-700">
                {stats.totalOut}{product.unit || '포'}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stats.outCount}회</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                평균 입고가
              </div>
              <div className="text-xl font-black text-sky-700">
                {Math.round(stats.avgInPrice).toLocaleString()}원
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">입출고 이력</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:shadow-md transition-all"
            >
              {ICONS.Plus} 입고 기록 추가
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">데이터를 불러오는 중...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-slate-400 text-center">
                <p className="font-bold mb-1">입출고 이력이 없습니다</p>
                <p className="text-sm">입고 기록을 추가하여 재고를 관리하세요</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      구분
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      수량
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      단가
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      총액
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {transaction.date}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          transaction.type === 'in'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {transaction.type === 'in' ? '입고' : '출고'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${
                          transaction.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}{product.unit || '포'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">
                        {transaction.unit_price.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {transaction.total_cost.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {transaction.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {transaction.type === 'in' ? (
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            수정
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddInventoryTransactionModal
          product={product}
          onClose={() => setShowAddModal(false)}
          onAdd={handleTransactionAdded}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditInventoryTransactionModal
          transaction={editingTransaction}
          product={product}
          onClose={() => setEditingTransaction(null)}
          onUpdate={handleTransactionAdded}
        />
      )}
    </div>
  );
};

export default InventoryDetailModal;
