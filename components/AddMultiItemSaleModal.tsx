
import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllCustomers } from '../services/database';
import { ICONS } from '../constants';

interface AddMultiItemSaleModalProps {
  onClose: () => void;
  onAdd: (sale: {
    customer_name: string;
    items: Array<{ product_name: string; quantity: number; unit_price: number }>;
    status: string;
    notes?: string;
    date?: string;
  }) => void;
}

const AddMultiItemSaleModal: React.FC<AddMultiItemSaleModalProps> = ({ onClose, onAdd }) => {
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // 오늘 날짜
  const [items, setItems] = useState<Array<{ product_name: string; quantity: number; unit_price: number; unit: string }>>([
    { product_name: '', quantity: 1, unit_price: 45000, unit: '포' }
  ]);
  const [status, setStatus] = useState('미결제');
  const [notes, setNotes] = useState('');

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

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 45000, unit: '포' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'product_name' | 'quantity' | 'unit_price' | 'unit', value: any) => {
    const newItems = [...items];

    if (field === 'product_name') {
      newItems[index][field] = value;
      // 품종 선택 시 자동으로 단가 입력
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].unit_price = product.unit_price;
      }
    } else if (field === 'quantity') {
      newItems[index][field] = parseInt(value) || 1;
    } else if (field === 'unit_price') {
      const numValue = value.replace(/[^0-9]/g, '');
      newItems[index][field] = parseInt(numValue) || 0;
    } else if (field === 'unit') {
      newItems[index][field] = value;
    }

    setItems(newItems);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    // 모든 품목이 입력되었는지 확인
    for (let i = 0; i < items.length; i++) {
      if (!items[i].product_name.trim()) {
        alert(`${i + 1}번째 품종을 입력해주세요.`);
        return;
      }
      if (items[i].quantity <= 0) {
        alert(`${i + 1}번째 수량은 1 이상이어야 합니다.`);
        return;
      }
    }

    onAdd({
      customer_name: customerName,
      items: items,
      status,
      notes: notes.trim() || undefined,
      date
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Plus}
              </div>
              <h2 className="text-xl font-bold">판매 기록 추가 (다품종)</h2>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              <datalist id="customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                판매 날짜 *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          {/* 품목 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                판매 품목 *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition-all flex items-center gap-1"
              >
                {ICONS.Plus} 품목 추가
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      {/* 품종 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                          품종
                        </label>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          list={`product-list-${index}`}
                          placeholder="품종명"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                        <datalist id={`product-list-${index}`}>
                          {products.map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
                      </div>

                      {/* 수량 & 단위 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                            수량
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            min="1"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                            단위
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          >
                            <option value="포">포</option>
                            <option value="알">알</option>
                            <option value="판">판</option>
                            <option value="개">개</option>
                            <option value="봉">봉</option>
                            <option value="kg">kg</option>
                            <option value="박스">박스</option>
                          </select>
                        </div>
                      </div>

                      {/* 단가 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                          단가 (원)
                        </label>
                        <input
                          type="text"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          placeholder="54333"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* 소계 및 삭제 버튼 */}
                    <div className="flex flex-col items-end gap-2 pt-5">
                      <span className="text-sm font-bold text-slate-700">
                        {(item.quantity * item.unit_price).toLocaleString()}원
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-6 h-6 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-all flex items-center justify-center"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
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
              rows={2}
              placeholder="추가 메모사항 (선택)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          {/* 총액 표시 */}
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border-2 border-sky-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">총 판매 금액</span>
                <div className="text-sm text-slate-600 mt-1">품목 {items.length}개</div>
              </div>
              <span className="text-3xl font-black text-sky-600">
                {getTotalAmount().toLocaleString()}원
              </span>
            </div>
          </div>
        </form>

        {/* Buttons */}
        <div className="shrink-0 p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-sky-100 hover:shadow-xl transition-all"
            >
              추가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMultiItemSaleModal;
