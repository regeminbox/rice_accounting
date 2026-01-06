
import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllCustomers, updateSale } from '../services/database';
import { ICONS } from '../constants';

interface EditSaleModalProps {
  sale: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, onClose, onUpdate }) => {
  const [customerName, setCustomerName] = useState(sale.customer_name);
  const [productName, setProductName] = useState(sale.product_name);
  const [quantity, setQuantity] = useState(sale.quantity);
  const [unitPrice, setUnitPrice] = useState(sale.unit_price);
  const [status, setStatus] = useState(sale.status);
  const [notes, setNotes] = useState(sale.notes || '');

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const productsData = await getAllProducts() as any[];
      const customersData = await getAllCustomers() as any[];
      setProducts(productsData);
      setCustomers(customersData);
    };
    loadData();
  }, []);

  const handleProductChange = (name: string) => {
    setProductName(name);
    const product = products.find(p => p.name === name);
    if (product) {
      setUnitPrice(product.unit_price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    if (!productName.trim()) {
      alert('품종을 입력해주세요.');
      return;
    }

    if (quantity <= 0) {
      alert('수량은 1 이상이어야 합니다.');
      return;
    }

    try {
      await updateSale(sale.id, {
        customer_name: customerName,
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        status,
        notes: notes.trim() || undefined
      });

      alert('판매 기록이 수정되었습니다.');
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
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Edit}
              </div>
              <h2 className="text-xl font-bold">판매 기록 수정</h2>
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
            {/* 거래처 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                거래처명 *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                list="customer-list"
                placeholder="거래처명 입력 또는 선택"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <datalist id="customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* 품종 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                품종 *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => handleProductChange(e.target.value)}
                list="product-list"
                placeholder="품종명 입력"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <datalist id="product-list">
                {products.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 수량 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                수량 (포) *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* 단가 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                단가 (원) *
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* 결제 상태 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              결제 상태
            </label>
            <div className="flex gap-2">
              {['결제완료', '미결제', '배송중'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    status === s
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 비고 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              비고
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="추가 메모사항 (선택)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          {/* 총액 표시 */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">총 판매 금액</span>
              <span className="text-2xl font-black text-slate-800">
                {(quantity * unitPrice).toLocaleString()}원
              </span>
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
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-amber-100 hover:shadow-xl transition-all"
            >
              수정하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;
