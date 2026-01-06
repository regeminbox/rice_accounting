import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface ApiKeySettingsModalProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({ onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // localStorage에서 저장된 API 키 불러오기
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('API 키를 입력해주세요.');
      return;
    }

    // localStorage에 저장
    localStorage.setItem('gemini_api_key', apiKey.trim());
    onSave(apiKey.trim());
    alert('API 키가 저장되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                {ICONS.AI}
              </div>
              <h2 className="text-xl font-bold">Gemini API 키 설정</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Google AI Studio</strong>에서 무료 API 키를 발급받을 수 있습니다:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-bold underline mt-2 inline-block"
            >
              🔗 https://aistudio.google.com/app/apikey
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Gemini API 키
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">
              API 키는 브라우저 로컬 스토리지에 안전하게 저장됩니다.
            </p>
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
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-100 hover:shadow-xl transition-all"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettingsModal;
