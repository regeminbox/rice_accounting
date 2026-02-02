import React, { useState, useEffect } from 'react';
import { updateCustomer } from '../services/database';
import { closeModalWithFocusRestore } from '../utils/focusHelper';

interface EditCustomerModalProps {
  customer: {
    id: string;
    name: string;
    contact?: string;
    address?: string;
    balance: number;
  };
  onClose: () => void;
  onSave: () => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ customer, onClose, onSave }) => {
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contact || '');
  const [address, setAddress] = useState(customer.address || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      await updateCustomer(customer.id, {
        name: name.trim(),
        contact: contact.trim(),
        address: address.trim()
      });

      alert('거래처 정보가 저장되었습니다.');
      onSave();
      closeModalWithFocusRestore(onClose);
    } catch (error: any) {
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">거래처 정보 수정</h2>
            <p className="text-sm text-slate-500 mt-1">거래처 연락처와 주소를 입력하세요</p>
          </div>
          <button
            onClick={() => closeModalWithFocusRestore(onClose)}
            className="text-slate-400 hover:text-slate-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              거래처명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              연락처
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              주소
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="예: 서울특별시 강남구 테헤란로 123"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              💡 연락처와 주소는 선택사항입니다. 필요한 정보만 입력하세요.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => closeModalWithFocusRestore(onClose)}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;
