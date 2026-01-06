
import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { analyzeSalesData, analyzeReceiptImage } from '../services/geminiService';
import { chatWithAI } from '../services/aiChatService';
import ConfirmDataModal from './ConfirmDataModal';

interface AIPanelProps {
  onAutoAdd: (data: any) => void;
  todayInsight?: string;
  onNavigateToReports?: () => void;
  sales: any[];
  customers: any[];
  products: any[];
}

const AIPanel: React.FC<AIPanelProps> = ({ onAutoAdd, todayInsight, onNavigateToReports, sales, customers, products }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    // 먼저 판매 데이터 추출인지 확인 (거래처명, 품종, 수량이 모두 포함된 경우)
    const hasSaleKeywords = /(\d+포|\d+포대|포|수량|단가|원|결제|미결제)/.test(userMsg);
    const hasCustomerOrProduct = customers.some(c => userMsg.includes(c.name)) || products.some(p => userMsg.includes(p.name));

    if (hasSaleKeywords && (hasCustomerOrProduct || /새로|추가|판매|거래/.test(userMsg))) {
      // 판매 데이터 추출 모드
      const result = await analyzeSalesData(userMsg);

      if (result && result.customerName) {
        setHistory(prev => [...prev, {
          role: 'ai',
          content: `데이터를 추출했습니다:\n거래처: ${result.customerName}\n품종: ${result.productName}\n수량: ${result.quantity}포\n단가: ${result.unitPrice?.toLocaleString()}원\n\n확인 후 저장하시겠습니까?`
        }]);

        // 확인 모달 표시
        setExtractedData(result);
        setShowConfirmModal(true);
      } else {
        setHistory(prev => [...prev, { role: 'ai', content: "분석에 실패했습니다. 형식을 다시 확인해주세요.\n\n예시: '대박식당 고시히카리 5포 50000원 결제완료'" }]);
      }
    } else {
      // 데이터베이스 질의 응답 모드
      const aiResponse = await chatWithAI(userMsg, sales, customers, products);
      setHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }

    setIsLoading(false);
  };

  const handleConfirm = (data: any) => {
    onAutoAdd(data);
    setShowConfirmModal(false);
    setHistory(prev => [...prev, { role: 'ai', content: '✅ 판매 기록이 장부에 추가되었습니다!' }]);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setHistory(prev => [...prev, { role: 'ai', content: '취소되었습니다. 다시 시도해주세요.' }]);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setHistory(prev => [...prev, { role: 'user', content: `📷 영수증 이미지 업로드: ${file.name}` }]);
    setIsLoading(true);

    const result = await analyzeReceiptImage(file);

    if (result && result.customerName) {
      setHistory(prev => [...prev, {
        role: 'ai',
        content: `📄 영수증 분석 완료:\n거래처: ${result.customerName}\n품종: ${result.productName}\n수량: ${result.quantity}포\n금액: ${result.totalAmount?.toLocaleString()}원\n\n확인 후 저장하시겠습니까?`
      }]);

      // 확인 모달 표시
      setExtractedData({
        ...result,
        unitPrice: result.unitPrice || Math.floor(result.totalAmount / result.quantity)
      });
      setShowConfirmModal(true);
    } else {
      setHistory(prev => [...prev, { role: 'ai', content: "영수증 분석에 실패했습니다. 더 선명한 이미지를 업로드해주세요." }]);
    }

    setIsLoading(false);
    event.target.value = ''; // 파일 입력 초기화
  };

  return (
    <>
      {showConfirmModal && extractedData && (
        <ConfirmDataModal
          extractedData={extractedData}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            {ICONS.Bot}
          </div>
          <h2 className="font-bold text-slate-800">AI 커맨더</h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-widest">Live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Quick Insights Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-sky-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            {ICONS.AI}
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Today's Insight</span>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-4 whitespace-pre-wrap">
            {todayInsight || '데이터를 분석하는 중입니다...'}
          </p>
          <button
            onClick={onNavigateToReports}
            className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            상세 보고서 보기 {ICONS.ArrowRight}
          </button>
        </div>

        {/* Chat History */}
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 leading-relaxed">
                💬 "11월 총 매출은 얼마야?"<br/>
                💬 "거래처 중 미수금 많은 곳은?"<br/>
                💬 "대박식당 고시히카리 5포 50000원"<br/>
                와 같이 물어보거나 판매 기록을 입력하세요.
              </p>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-100' 
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-2xl flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {/* 영수증 업로드 버튼 */}
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full py-2.5 bg-white border-2 border-dashed border-sky-200 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-50 hover:border-sky-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            📷 영수증 사진 업로드
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="AI에게 무엇이든 물어보세요..."
            className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
          >
            {ICONS.Trending}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          Ctrl + Enter로 빠르게 입력할 수 있습니다.
        </p>
      </div>
    </div>
    </>
  );
};

export default AIPanel;
