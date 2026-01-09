
import React, { useState } from 'react';
import { updateProduct } from '../services/database';
import { ICONS } from '../constants';

interface EditProductModalProps {
  product: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onUpdate }) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [stock, setStock] = useState(product.stock);
  const [unitPrice, setUnitPrice] = useState(product.unit_price);
  const [costPrice, setCostPrice] = useState(product.cost_price);
  const [safetyStock, setSafetyStock] = useState(product.safety_stock);
  const [unit, setUnit] = useState(product.unit || '포');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('품종명을 입력해주세요.');
      return;
    }

    if (stock < 0) {
      alert('재고는 0 이상이어야 합니다.');
      return;
    }

    try {
      await updateProduct(product.id, {
        name: name.trim(),
        category,
        stock,
        unit_price: unitPrice,
        cost_price: costPrice,
        safety_stock: safetyStock,
        unit
      });

      alert('품종 정보가 수정되었습니다.');
      await onUpdate();
      onClose();
    } catch (error: any) {
      alert(`수정 실패: ${error.message}`);
      console.error('수정 에러:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Edit}
              </div>
              <h2 className="text-xl font-bold">품종 정보 수정</h2>
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
          <div className="grid grid-cols-2 gap-6">
            {/* 품종명 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                품종명 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="품종명 입력"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* 분류 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                분류 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="백미">백미</option>
                <option value="현미">현미</option>
                <option value="찹쌀">찹쌀</option>
                <option value="소금">소금</option>
                <option value="계란">계란</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* 단위 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                단위 *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="포">포</option>
                <option value="봉">봉</option>
                <option value="판">판</option>
                <option value="개">개</option>
                <option value="기타">기타</option>
                <option value="kg">kg</option>
                <option value="박스">박스</option>
              </select>
            </div>

            {/* 재고 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                재고 ({unit}) *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* 안전재고 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                안전재고 ({unit}) *
              </label>
              <input
                type="number"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* 판매단가 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                판매단가 (원) *
              </label>
              <input
                type="text"
                value={unitPrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setUnitPrice(parseInt(value) || 0);
                }}
                placeholder="54333"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* 원가 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                원가 (원) *
              </label>
              <input
                type="text"
                value={costPrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setCostPrice(parseInt(value) || 0);
                }}
                placeholder="45000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
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
              수정하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
