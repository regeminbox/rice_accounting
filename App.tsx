
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import AIPanel from './components/AIPanel';
import WelcomeModal from './components/WelcomeModal';
import AddSaleModal from './components/AddSaleModal';
import AddMultiItemSaleModal from './components/AddMultiItemSaleModal';
import EditSaleModal from './components/EditSaleModal';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import ReportsPage from './components/ReportsPage';
import ApiKeySettingsModal from './components/ApiKeySettingsModal';
import { SaleRecord, OrderStatus, NavItem } from './types';
import { ICONS } from './constants';
import { getAllCustomers, getAllProducts } from './services/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  initDatabase,
  getUserProfile,
  saveUserProfile,
  getAllSales,
  getDashboardStats,
  getTopCustomers,
  getWeeklySalesData,
  getRealtimeInsights,
  addSale,
  addMultiItemSale,
  deleteSale,
  createBackup
} from './services/database';
import {
  exportSalesToExcel,
  exportAllData,
  importSalesFromExcel
} from './services/excelService';
import { analyzeSalesData } from './services/geminiService';

const INITIAL_SALES: SaleRecord[] = [
  { id: '1', date: '2025-05-10', customerName: '대박식당', productName: '고시히카리', quantity: 5, unitPrice: 50000, totalAmount: 250000, status: OrderStatus.PAID },
  { id: '2', date: '2025-05-11', customerName: '만수무강 한정식', productName: '아끼바레(추청)', quantity: 10, unitPrice: 48000, totalAmount: 480000, status: OrderStatus.UNPAID },
  { id: '3', date: '2025-05-11', customerName: '늘봄도시락', productName: '삼광쌀', quantity: 20, unitPrice: 45000, totalAmount: 900000, status: OrderStatus.DELIVERING },
  { id: '4', date: '2025-05-12', customerName: '행복분식', productName: '고시히카리', quantity: 2, unitPrice: 52000, totalAmount: 104000, status: OrderStatus.PAID },
  { id: '5', date: '2025-05-12', customerName: '동네쌀국수', productName: '안남미', quantity: 5, unitPrice: 40000, totalAmount: 200000, status: OrderStatus.UNPAID },
];

const CHART_DATA = [
  { name: '05/06', sales: 1200000 },
  { name: '05/07', sales: 900000 },
  { name: '05/08', sales: 2100000 },
  { name: '05/09', sales: 1500000 },
  { name: '05/10', sales: 2500000 },
  { name: '05/11', sales: 1800000 },
  { name: '05/12', sales: 3200000 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem['id']>('dashboard');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([]);
  const [insights, setInsights] = useState<{ mainInsight: string; sidebarInsight: string }>({
    mainInsight: '',
    sidebarInsight: ''
  });
  const [commandInput, setCommandInput] = useState('');

  // Initialize database and load data
  useEffect(() => {
    const initialize = async () => {
      await initDatabase();

      // 자동 백업 수행 (앱 시작 시)
      try {
        const backupPath = await createBackup();
        console.log(`✅ 데이터베이스 자동 백업 완료: ${backupPath}`);
      } catch (error) {
        console.error('⚠️ 자동 백업 실패:', error);
      }

      await loadData();
    };

    initialize();
  }, []);

  const loadData = async () => {
    // Load user profile
    const profile = await getUserProfile();
    if (!profile) {
      setShowWelcome(true);
    } else {
      setUserProfile(profile);
    }

    // Load sales data
    const salesData = await getAllSales() as any[];
    setSales(salesData.map((sale: any) => ({
      id: sale.id,
      date: sale.date,
      customerName: sale.customer_name,
      // 다품종 주문인 경우 품목 정보 처리
      productName: sale.is_multi_item && sale.items
        ? sale.items.map((item: any) => item.product_name).join(', ')
        : sale.product_name,
      quantity: sale.is_multi_item && sale.items
        ? sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        : sale.quantity,
      unitPrice: sale.is_multi_item && sale.items
        ? Math.round(sale.total_amount / sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0))
        : sale.unit_price,
      totalAmount: sale.total_amount,
      status: sale.status as OrderStatus,
      isMultiItem: sale.is_multi_item || false,
      items: sale.items || null
    })));

    // Load dashboard stats
    const stats = await getDashboardStats();
    setDashboardStats(stats);

    // Load top customers
    const customers = await getTopCustomers(5);
    setTopCustomers(customers);

    // Load weekly sales data
    const weeklyData = await getWeeklySalesData();
    setWeeklySalesData(weeklyData);

    // Load AI insights
    const insightsData = await getRealtimeInsights();
    setInsights(insightsData);

    // Load customers and products for AI chat
    const customersData = await getAllCustomers() as any[];
    const productsData = await getAllProducts() as any[];
    setCustomers(customersData);
    setProducts(productsData);
  };

  // Keyboard shortcuts removed per user request

  // 다품종 주문 추가
  const handleMultiItemAdd = async (sale: any) => {
    try {
      const result = await addMultiItemSale(sale) as any;

      if (result.warning) {
        alert(result.warning);
      } else {
        alert('판매 기록이 추가되었습니다!');
      }

      await loadData();
    } catch (error: any) {
      alert(`추가 실패: ${error.message}`);
      console.error('추가 에러:', error);
    }
  };

  const handleAutoAdd = async (extracted: any) => {
    try {
      // 다품종 주문인 경우
      if (extracted.items && Array.isArray(extracted.items)) {
        return handleMultiItemAdd(extracted);
      }

      // AddSaleModal에서는 customer_name, product_name으로 전달되고
      // AI에서는 customerName, productName으로 전달될 수 있으므로 둘 다 지원
      const customerName = extracted.customer_name || extracted.customerName;
      const productName = extracted.product_name || extracted.productName;
      const unitPrice = extracted.unit_price || extracted.unitPrice;

      // 필수 필드 검증
      if (!customerName || !customerName.trim()) {
        alert('거래처명을 입력해주세요.');
        return;
      }

      if (!productName || !productName.trim()) {
        alert('품종을 입력해주세요.');
        return;
      }

      const result = await addSale({
        customer_name: customerName.trim(),
        product_name: productName.trim(),
        quantity: extracted.quantity || 1,
        unit_price: unitPrice || 45000,
        status: extracted.status || '미결제',
        notes: extracted.notes
      }) as any;

      if (result.warning) {
        alert(result.warning);
      }

      // Reload data
      await loadData();

    } catch (error: any) {
      alert(`판매 기록 추가 실패: ${error.message}`);
    }
  };

  const handleEditSale = async (sale: SaleRecord) => {
    // 원본 데이터베이스에서 판매 정보 가져오기 (다품종 정보 포함)
    const allSales = await getAllSales() as any[];
    const originalSale = allSales.find((s: any) => s.id === sale.id);

    if (originalSale) {
      setEditingSale(originalSale);
    } else {
      // fallback: SaleRecord를 database sale format으로 변환
      setEditingSale({
        id: sale.id,
        customer_name: sale.customerName,
        product_name: sale.productName,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        status: sale.status,
        date: sale.date,
        notes: '',
        is_multi_item: (sale as any).isMultiItem || false,
        items: (sale as any).items || null
      });
    }
  };

  const handleDeleteSale = async (sale: SaleRecord) => {
    if (!confirm(`"${sale.customerName}" 거래처의 ${sale.productName} 판매 기록을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('삭제 시작:', sale.id);
      await deleteSale(sale.id);
      console.log('삭제 완료');
      alert('판매 기록이 삭제되었습니다.');
      await loadData();
    } catch (error: any) {
      console.error('삭제 에러:', error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleWelcomeComplete = async (profile: any) => {
    await saveUserProfile(profile);
    setUserProfile(profile);
    setShowWelcome(false);
    await loadData();
  };

  const handleExportSales = async () => {
    try {
      const salesData = await getAllSales();
      const filename = exportSalesToExcel(salesData as any[]);
      alert(`✅ 판매 내역이 '${filename}' 파일로 저장되었습니다.`);
    } catch (error: any) {
      alert(`❌ 내보내기 실패: ${error.message}`);
    }
  };

  const handleExportAll = async () => {
    try {
      const filename = await exportAllData();
      alert(`✅ 전체 데이터가 '${filename}' 파일로 저장되었습니다.`);
    } catch (error: any) {
      alert(`❌ 내보내기 실패: ${error.message}`);
    }
  };

  const handleImportSales = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importSalesFromExcel(file);

      if (result.errors.length > 0) {
        alert(`⚠️ 일부 데이터 가져오기 실패:\n성공: ${result.success}건\n실패: ${result.errors.length}건\n\n오류 내역:\n${result.errors.slice(0, 5).join('\n')}`);
      } else {
        alert(`✅ ${result.success}건의 판매 내역을 성공적으로 가져왔습니다.`);
      }

      loadData();
      event.target.value = ''; // 파일 입력 초기화
    } catch (error: any) {
      alert(`❌ 가져오기 실패: ${error.message}`);
      event.target.value = '';
    }
  };

  const handleCommandSubmit = async () => {
    if (!commandInput.trim()) return;

    // AI에게 명령어 전달
    const result = await analyzeSalesData(commandInput);

    if (result && result.customerName) {
      await handleAutoAdd(result);
      setCommandInput('');
      setIsCommandOpen(false);
    } else {
      alert('명령어를 이해하지 못했습니다. 다시 시도해주세요.\n\n예시: "대박식당 고시히카리 5포 50000원 결제완료"');
    }
  };

  const getAIRecommendedCommands = () => {
    const commands = [];

    // 재고 부족 품종 추천
    if (dashboardStats?.lowStockCount > 0) {
      commands.push('재고 부족 품종 확인해줘');
    }

    // 미수금 추천
    if (dashboardStats?.totalUnpaid > 0) {
      commands.push('미수금 가장 많은 거래처 보여줘');
    }

    // 기본 추천
    commands.push('오늘 총 매출 요약해줘');
    commands.push('어제 판매 내역 확인');

    return commands.slice(0, 4);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans selection:bg-sky-100 selection:text-sky-900 overflow-hidden">
      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onComplete={handleWelcomeComplete} />}

      {/* API Key Settings Modal */}
      {showApiKeySettings && (
        <ApiKeySettingsModal
          onClose={() => setShowApiKeySettings(false)}
          onSave={(apiKey) => {
            console.log('API 키 저장됨');
          }}
        />
      )}

      {/* Add Sale Modal - 다품종 주문 */}
      {showAddSaleModal && (
        <AddMultiItemSaleModal
          onClose={() => setShowAddSaleModal(false)}
          onAdd={handleAutoAdd}
        />
      )}

      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onUpdate={loadData}
        />
      )}

      {/* LNB - Left Navigation Bar */}
      <Sidebar
        activeId={activeTab}
        onNavigate={setActiveTab}
        userProfile={userProfile}
        onProfileClick={() => setShowWelcome(true)}
        aiInsight={insights.sidebarInsight}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab === 'dashboard' ? '실시간 비즈니스 현황' : activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowApiKeySettings(true)}
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2"
            >
              {ICONS.AI} API 키 설정
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200/50">

            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="오늘 총 매출"
                  value={`${(dashboardStats?.todaySales || 0).toLocaleString()}원`}
                  icon={ICONS.Trending}
                  color="sky"
                />
                <StatCard
                  label="미수금 현황"
                  value={`${(dashboardStats?.totalUnpaid || 0).toLocaleString()}원`}
                  icon={ICONS.Alert}
                  color="rose"
                />
                <StatCard
                  label="신규 주문"
                  value={`${dashboardStats?.todayOrders || 0}건`}
                  icon={ICONS.Plus}
                  color="emerald"
                />
                <StatCard
                  label="재고 부족 품종"
                  value={`${dashboardStats?.lowStockCount || 0}종`}
                  icon={ICONS.Alert}
                  color="amber"
                />
              </div>

              {/* Charts & Top Customers Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800">주간 매출 추이</h3>
                    <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-2 py-1 outline-none">
                      <option>최근 7일</option>
                      <option>이번 달</option>
                    </select>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklySalesData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `${v/10000}만`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Customers Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800">주요 거래처 Top 5</h3>
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      {ICONS.Customers}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {topCustomers.length > 0 ? (
                      topCustomers.map((customer: any, idx: number) => (
                        <div key={customer.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-100">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-sm truncate">{customer.name}</div>
                            <div className="text-xs text-slate-400">{customer.order_count || 0}건 주문</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-800 text-sm">
                              {(customer.total_sales || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">원</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        거래 내역이 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transactions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    최근 판매 기록
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">Real-time</span>
                  </h3>
                  <button onClick={() => setActiveTab('sales')} className="text-xs font-bold text-sky-600 hover:text-sky-700">전체보기 {ICONS.ArrowRight}</button>
                </div>
                <DataTable
                  data={sales}
                  onAddClick={() => setShowAddSaleModal(true)}
                  onImportClick={handleImportSales}
                  onEditClick={handleEditSale}
                  onDeleteClick={handleDeleteSale}
                />
              </div>
            </>
          )}

          {activeTab === 'sales' && (
            <DataTable
              data={sales}
              onAddClick={() => setShowAddSaleModal(true)}
              onImportClick={handleImportSales}
              onEditClick={handleEditSale}
              onDeleteClick={handleDeleteSale}
            />
          )}

          {activeTab === 'inventory' && <InventoryPage />}

          {activeTab === 'customers' && <CustomersPage />}

          {activeTab === 'reports' && <ReportsPage />}
        </div>
      </main>

      {/* RHS - AI Assistant Panel */}
      <AIPanel
        onAutoAdd={handleAutoAdd}
        todayInsight={insights.mainInsight}
        onNavigateToReports={() => setActiveTab('reports')}
        sales={sales.map(s => ({
          id: s.id,
          date: s.date,
          customer_id: '',
          customer_name: s.customerName,
          product_id: '',
          product_name: s.productName,
          quantity: s.quantity,
          unit_price: s.unitPrice,
          total_amount: s.totalAmount,
          payment_status: s.status,
          status: s.status,
          created_at: ''
        }))}
        customers={customers}
        products={products}
      />

      {/* Command Center Modal (Spotlight UI) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="text-sky-500">{ICONS.Search}</div>
              <input
                autoFocus
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="AI 명령어를 입력하세요 (예: '대박식당 고시히카리 5포 50000원 결제완료')"
                className="flex-1 bg-transparent border-none text-lg font-medium text-slate-800 focus:outline-none placeholder:text-slate-300"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsCommandOpen(false);
                    setCommandInput('');
                  }
                  if (e.key === 'Enter') {
                    handleCommandSubmit();
                  }
                }}
              />
              <button
                onClick={() => {
                  setIsCommandOpen(false);
                  setCommandInput('');
                }}
                className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200"
              >
                Esc
              </button>
            </div>
            <div className="p-4 bg-slate-50/50">
              <h5 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI 추천 명령어</h5>
              <div className="space-y-1">
                {getAIRecommendedCommands().map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => setCommandInput(cmd)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-white text-sm text-slate-600 font-medium transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:text-sky-500 shadow-sm">
                      {ICONS.Bot}
                    </div>
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  color: 'sky' | 'rose' | 'emerald' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon, color }) => {
  const colors = {
    sky: 'bg-sky-50 text-sky-600 shadow-sky-100',
    rose: 'bg-rose-50 text-rose-600 shadow-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100',
    amber: 'bg-amber-50 text-amber-600 shadow-amber-100'
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md group">
      <div className={`flex items-center ${trend ? 'justify-between' : 'justify-start'} mb-4`}>
        <div className={`p-2 rounded-xl transition-colors ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
            trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
  );
};

export default App;
