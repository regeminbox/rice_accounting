
import React, { useState, useEffect } from 'react';
import { getAllSales, getAllProducts, getAllCustomers, getDashboardStats } from '../services/database';
import { getAIInsights } from '../services/geminiService';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Pagination from './Pagination';

const ReportsPage: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [aiInsights, setAIInsights] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '1year' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const salesData = await getAllSales() as any[];
    const productsData = await getAllProducts() as any[];
    const customersData = await getAllCustomers() as any[];

    setSales(salesData);
    setProducts(productsData);
    setCustomers(customersData);
    setIsLoading(false);
  };

  const filterSalesByPeriod = (salesData: any[]) => {
    if (selectedPeriod === 'all') return salesData;

    const now = new Date();
    const cutoffDate = new Date();

    if (selectedPeriod === '1month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (selectedPeriod === '1year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    return salesData.filter(sale => {
      if (!sale.date) return true;
      const saleDate = new Date(sale.date);
      return saleDate >= cutoffDate;
    });
  };

  const handleGenerateAIInsights = async () => {
    setIsLoadingAI(true);
    const filteredSales = filterSalesByPeriod(sales);
    // 필터링된 전체 판매 데이터를 AI에 전달 (최대 10,000개까지)
    const salesForAI = filteredSales.slice(0, 10000);
    const insights = await getAIInsights(products, salesForAI);
    setAIInsights(insights);
    setIsLoadingAI(false);
  };

  // 품종별 판매량 집계
  const filteredSales = filterSalesByPeriod(sales);

  const productSalesData = products.map(product => {
    const productSales = filteredSales.filter(s => s.product_id === product.id);
    const totalQuantity = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = productSales.reduce((sum, s) => sum + s.total_amount, 0);

    return {
      name: product.name,
      quantity: totalQuantity,
      revenue: totalRevenue,
      stock: product.stock
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // 페이지네이션
  const totalPages = Math.ceil(productSalesData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProductData = productSalesData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 월별 매출 집계
  const monthlySalesData = (() => {
    const monthlyMap: { [key: string]: number } = {};

    filteredSales.forEach(sale => {
      const month = sale.date.substring(0, 7); // yyyy-MM
      monthlyMap[month] = (monthlyMap[month] || 0) + sale.total_amount;
    });

    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        name: month,
        amount
      }));
  })();

  // 결제 상태별 통계
  const paymentStatusData = [
    { name: '결제완료', value: filteredSales.filter(s => s.status === '결제완료').length, color: '#10b981' },
    { name: '미결제', value: filteredSales.filter(s => s.status === '미결제').length, color: '#f43f5e' },
    { name: '배송중', value: filteredSales.filter(s => s.status === '배송중').length, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-xl">AI 분석 보고서</h3>
          <p className="text-sm text-slate-500 mt-1">
            데이터 기반 비즈니스 인사이트
          </p>
        </div>
        <button
          onClick={handleGenerateAIInsights}
          disabled={isLoadingAI}
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-100 flex items-center gap-2 hover:shadow-xl transition-all disabled:opacity-50"
        >
          {ICONS.AI} {isLoadingAI ? 'AI 분석 중...' : 'AI 인사이트 생성'}
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-700 mb-1">분석 기간 선택</h4>
            <p className="text-xs text-slate-500">조회 기간을 선택하여 보고서를 확인하세요</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('1month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === '1month'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1개월
            </button>
            <button
              onClick={() => setSelectedPeriod('1year')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === '1year'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1년
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-indigo-500 to-sky-600 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            {ICONS.AI}
            <span className="text-sm font-bold uppercase tracking-wider">AI 경영 조언</span>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {aiInsights}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Performance */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-6">품종별 판매 실적</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${v / 10000}만`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => `${value.toLocaleString()}원`}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-6">결제 상태 분포</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {paymentStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-bold text-slate-600">
                  {item.name}: {item.value}건
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Details Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h4 className="font-bold text-slate-800">품종별 상세 분석</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  품종명
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  판매량
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  판매액
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  현재 재고
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  재고 상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProductData.map((item) => {
                const product = products.find(p => p.name === item.name);
                const isLowStock = product && product.stock <= product.safety_stock;

                return (
                  <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-700">{item.quantity}포</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-800">
                        {item.revenue.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                        {item.stock}포
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isLowStock
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isLowStock ? '부족' : '정상'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 pb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            총 {productSalesData.length}개 품종 {totalPages > 1 && `(페이지 ${currentPage}/${totalPages})`}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-6">
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">
            {selectedPeriod === 'all' ? '총 판매 건수' : '기간 판매 건수'}
          </div>
          <div className="text-3xl font-black text-sky-700">{filteredSales.length}건</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
            {selectedPeriod === 'all' ? '총 매출액' : '기간 매출액'}
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {filteredSales.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}원
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
            {selectedPeriod === 'all' ? '총 미수금' : '기간 미수금'}
          </div>
          <div className="text-2xl font-black text-rose-700">
            {filteredSales.filter(s => s.status === '미결제').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}원
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            {selectedPeriod === 'all' ? '총 거래처' : '기간 거래처'}
          </div>
          <div className="text-3xl font-black text-indigo-700">
            {selectedPeriod === 'all'
              ? customers.length
              : [...new Set(filteredSales.map(s => s.customer_id))].length
            }개
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
