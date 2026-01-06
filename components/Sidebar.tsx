
import React from 'react';
import { ICONS } from '../constants';
import { NavItem } from '../types';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: NavItem['id']) => void;
  userProfile?: {
    shop_name: string;
    owner_name: string;
  } | null;
  onProfileClick?: () => void;
  aiInsight?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: '대시보드', icon: ICONS.Dashboard },
  { id: 'sales', label: '판매기록', icon: ICONS.Sales },
  { id: 'inventory', label: '재고관리', icon: ICONS.Inventory },
  { id: 'customers', label: '거래처/미수금', icon: ICONS.Customers },
  { id: 'reports', label: 'AI 분석 보고서', icon: ICONS.Reports },
];

const Sidebar: React.FC<SidebarProps> = ({ activeId, onNavigate, userProfile, onProfileClick, aiInsight }) => {
  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
          <span className="font-bold text-xl italic leading-none">R</span>
        </div>
        <div>
          <h1 className="font-bold text-slate-800 tracking-tight">RiceManager AI</h1>
          <p className="text-[10px] text-slate-400 font-medium">VER 2.5 PREMIUM</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeId === item.id
                ? 'bg-sky-50 text-sky-600 font-semibold shadow-sm shadow-sky-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span className={activeId === item.id ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'}>
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
            {activeId === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-sky-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-600">AI 실시간 감시 중</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {aiInsight || '데이터를 분석하는 중...'}
          </p>
        </div>

        {userProfile && (
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg font-bold border border-white/10">
                {userProfile.owner_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{userProfile.shop_name}</div>
                <div className="text-xs opacity-80 truncate">{userProfile.owner_name} 사장님</div>
              </div>
            </div>
            <button
              onClick={onProfileClick}
              className="w-full py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-xs font-medium transition-all border border-white/10"
            >
              프로필 설정
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
