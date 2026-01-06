
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface ConfirmDataModalProps {
  extractedData: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    status: string;
  };
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

const ConfirmDataModal: React.FC<ConfirmDataModalProps> = ({
  extractedData,
  onConfirm,
  onCancel
}) => {
  const [customerName, setCustomerName] = useState(extractedData.customerName);
  const [productName, setProductName] = useState(extractedData.productName);
  const [quantity, setQuantity] = useState(extractedData.quantity);
  const [unitPrice, setUnitPrice] = useState(extractedData.unitPrice);
  const [status, setStatus] = useState(extractedData.status);

  const totalAmount = quantity * unitPrice;

  const handleConfirm = () => {
    onConfirm({
      customerName,
      productName,
      quantity,
      unitPrice,
      status
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-sky-500 to-indigo-600">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              {ICONS.Bot}
            </div>
            <div>
              <h3 className="font-bold text-lg">AI가 추출한 데이터를 확인해주세요</h3>
              <p className="text-xs opacity-80 mt-1">잘못된 정보가 있다면 수정 후 저장하세요.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 거래처명 */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                거래처명 *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="예: 대박식당"
              />
            </div>

            {/* 품종명 */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                품종명 *
              </label>
              <select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              >
                <option value="고시히카리">고시히카리</option>
                <option value="추청(아끼바레)">추청(아끼바레)</option>
                <option value="삼광쌀">삼광쌀</option>
                <option value="오대쌀">오대쌀</option>
                <option value="안남미">안남미</option>
                <option value="현미">현미</option>
              </select>
            </div>

            {/* 수량 */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                수량 (포) *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                min="1"
              />
            </div>

            {/* 단가 */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                단가 (원) *
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                min="0"
                step="1000"
              />
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                결제 상태 *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              >
                <option value="결제완료">결제완료</option>
                <option value="미결제">미결제</option>
                <option value="배송중">배송중</option>
              </select>
            </div>

            {/* 총액 (자동 계산) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                총 금액 (자동계산)
              </label>
              <div className="px-4 py-3 bg-sky-50 border border-sky-100 rounded-xl">
                <div className="text-xl font-black text-sky-600">
                  {totalAmount.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <div className="text-amber-600 shrink-0 mt-0.5">
              {ICONS.Alert}
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-700 mb-1">주의사항</div>
              <p className="text-xs text-amber-600 leading-relaxed">
                저장 시 재고가 자동으로 차감되며, 미결제 건은 미수금으로 기록됩니다.
                품종명과 거래처명이 정확한지 다시 한 번 확인해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-indigo-700 transition-all shadow-lg shadow-sky-100 flex items-center gap-2"
          >
            {ICONS.Plus}
            판매 기록에 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDataModal;
