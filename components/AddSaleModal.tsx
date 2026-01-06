
import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllCustomers } from '../services/database';
import { ICONS } from '../constants';

interface AddSaleModalProps {
  onClose: () => void;
  onAdd: (sale: {
    customer_name: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    status: string;
    notes?: string;
  }) => void;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ onClose, onAdd }) => {
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(45000);
  const [status, setStatus] = useState('미결제');
  const [notes, setNotes] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<string[]>([]);
  const [frequentCustomers, setFrequentCustomers] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const productsData = await getAllProducts() as any[];
      const customersData = await getAllCustomers() as any[];
      setProducts(productsData);
      setCustomers(customersData);

      // 로컬스토리지에서 자주 검색한 품종 불러오기
      const savedFrequentProducts = localStorage.getItem('frequentProducts');
      if (savedFrequentProducts) {
        setFrequentProducts(JSON.parse(savedFrequentProducts));
      }

      // 로컬스토리지에서 자주 검색한 거래처 불러오기
      const savedFrequentCustomers = localStorage.getItem('frequentCustomers');
      if (savedFrequentCustomers) {
        setFrequentCustomers(JSON.parse(savedFrequentCustomers));
      }
    };
    loadData();
  }, []);

  const handleProductChange = (name: string) => {
    setProductName(name);
    const product = products.find(p => p.name === name);
    if (product) {
      setUnitPrice(product.unit_price);
    } else {
      // 새로운 품종인 경우 기본 단가 유지
      if (!unitPrice || unitPrice === 0) {
        setUnitPrice(45000);
      }
    }
  };

  const trackFrequentProduct = (name: string) => {
    if (!name.trim()) return;

    const savedFrequent = localStorage.getItem('frequentProducts');
    let frequentList: string[] = savedFrequent ? JSON.parse(savedFrequent) : [];

    // 이미 있으면 제거 후 맨 앞에 추가
    frequentList = frequentList.filter(p => p !== name);
    frequentList.unshift(name);

    // 최대 10개까지만 저장
    frequentList = frequentList.slice(0, 10);

    localStorage.setItem('frequentProducts', JSON.stringify(frequentList));
  };

  const trackFrequentCustomer = (name: string) => {
    if (!name.trim()) return;

    const savedFrequent = localStorage.getItem('frequentCustomers');
    let frequentList: string[] = savedFrequent ? JSON.parse(savedFrequent) : [];

    // 이미 있으면 제거 후 맨 앞에 추가
    frequentList = frequentList.filter(c => c !== name);
    frequentList.unshift(name);

    // 최대 10개까지만 저장
    frequentList = frequentList.slice(0, 10);

    localStorage.setItem('frequentCustomers', JSON.stringify(frequentList));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== 판매 기록 추가 ===');
    console.log('거래처명:', customerName);
    console.log('품종:', productName);
    console.log('수량:', quantity);
    console.log('단가:', unitPrice);

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

    // 자주 검색한 품종과 거래처로 추적
    trackFrequentProduct(productName);
    trackFrequentCustomer(customerName);

    onAdd({
      customer_name: customerName,
      product_name: productName,
      quantity,
      unit_price: unitPrice,
      status,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.Plus}
              </div>
              <h2 className="text-xl font-bold">판매 기록 추가</h2>
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              <datalist id="customer-list">
                {/* 자주 검색한 거래처 먼저 표시 */}
                {frequentCustomers.map((name, idx) => (
                  <option key={`frequent-${idx}`} value={name} />
                ))}
                {/* 전체 거래처 목록 */}
                {customers
                  .filter(c => !frequentCustomers.includes(c.name))
                  .map((c) => (
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
                list="product-suggestions"
                placeholder="품종명 입력"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              <datalist id="product-suggestions">
                {/* 자주 검색한 품종 먼저 표시 */}
                {frequentProducts.map((name, idx) => (
                  <option key={`frequent-${idx}`} value={name} />
                ))}
                {/* 전체 품종 목록 */}
                {products
                  .filter(p => !frequentProducts.includes(p.name))
                  .map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
              </datalist>
            </div>

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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
              rows={3}
              placeholder="추가 메모사항 (선택)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
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
              className="flex-1 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-sky-100 hover:shadow-xl transition-all"
            >
              추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleModal;
