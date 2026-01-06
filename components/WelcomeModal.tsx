
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface WelcomeModalProps {
  onComplete: (profile: {
    shop_name: string;
    owner_name: string;
    contact?: string;
  }) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = () => {
    if (!shopName.trim() || !ownerName.trim()) {
      alert('정미소 이름과 사장님 성함은 필수 입력 항목입니다.');
      return;
    }

    onComplete({
      shop_name: shopName,
      owner_name: ownerName,
      contact: contact || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-sky-100">
            🌾
          </div>
          <h2 className="text-2xl font-black text-slate-800">환영합니다!</h2>
          <p className="text-sm text-slate-500 mt-2">정미소 정보를 입력해주세요</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              정미소 이름 *
            </label>
            <input
              type="text"
              placeholder="예: 신천지 정미소"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              사장님 성함 *
            </label>
            <input
              type="text"
              placeholder="예: 김철수"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              연락처 (선택)
            </label>
            <input
              type="tel"
              placeholder="예: 010-1234-5678"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-indigo-700 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
        >
          {ICONS.ArrowRight}
          시작하기
        </button>

        <p className="text-xs text-center text-slate-400 mt-4">
          나중에 설정에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default WelcomeModal;
