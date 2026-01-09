
import React, { useState } from 'react';
import { addInventoryTransaction } from '../services/database';
import { ICONS } from '../constants';

interface AddInventoryTransactionModalProps {
  product: any;
  onClose: () => void;
  onAdd: () => void;
}

const AddInventoryTransactionModal: React.FC<AddInventoryTransactionModalProps> = ({ product, onClose, onAdd }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(product.cost_price || 0);
  const [notes, setNotes] = useState('');

  const totalCost = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      alert('수량은 0보다 커야 합니다.');
      return;
    }

    if (unitPrice < 0) {
      alert('단가는 0 이상이어야 합니다.');
      return;
    }

    try {
      await addInventoryTransaction({
        product_id: product.id,
        product_name: product.name,
        date,
        quantity,
        unit_price: unitPrice,
        type: 'in',
        notes: notes.trim() || undefined
      });

      alert('입고 기록이 추가되었습니다.');
      await onAdd();
      onClose();
    } catch (error: any) {
      alert(`추가 실패: ${error.message}`);
      console.error('입고 기록 추가 에러:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Plus}
              </div>
              <div>
                <h2 className="text-xl font-bold">입고 기록 추가</h2>
                <p className="text-sm text-white/80 mt-1">{product.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 날짜 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              입고 날짜 *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 수량 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              수량 ({product.unit || '포'}) *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="입고 수량"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 단가 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              단가 (원) *
            </label>
            <input
              type="text"
              value={unitPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setUnitPrice(parseInt(value) || 0);
              }}
              placeholder="입고 단가"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 총액 (자동 계산) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              총액
            </label>
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-xl font-black text-emerald-700">
                {totalCost.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              메모
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="입고 관련 메모 (선택사항)"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:shadow-xl transition-all"
            >
              입고 기록 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryTransactionModal;
