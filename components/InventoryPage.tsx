
import React, { useState, useEffect } from 'react';
import { getAllProducts, updateProductStock, deleteProduct, addProduct } from '../services/database';
import { ICONS } from '../constants';
import EditProductModal from './EditProductModal';
import AddProductModal from './AddProductModal';
import InventoryDetailModal from './InventoryDetailModal';
import Pagination from './Pagination';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await getAllProducts() as any[];
    setProducts(data);
    setIsLoading(false);
  };

  const handleStockAdjustment = async (productId: string, change: number) => {
    try {
      await updateProductStock(productId, change);
      await loadProducts();
    } catch (error: any) {
      alert(`재고 수정 실패: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`정말 "${productName}" 품종을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      alert('품종이 삭제되었습니다.');
      await loadProducts();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleAddProduct = async (productData: {
    name: string;
    category: string;
    stock: number;
    unit_price: number;
    cost_price: number;
    safety_stock: number;
  }) => {
    try {
      await addProduct(productData);
      alert('품종이 추가되었습니다.');
      await loadProducts();
    } catch (error: any) {
      alert(`추가 실패: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 검색 필터링
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 페이지네이션
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 검색어 변경 시 페이지를 1로 리셋
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-xl">재고 관리</h3>
          <p className="text-sm text-slate-500 mt-1">
            현재 {products.length}개 품종 관리 중
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:shadow-md transition-all"
          >
            {ICONS.Plus} 품종 추가
          </button>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            {ICONS.Trending} 새로고침
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          {ICONS.Search}
        </div>
        <input
          type="text"
          placeholder="품종명으로 검색..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => {
          const stockPercentage = product.safety_stock > 0
            ? (product.stock / product.safety_stock) * 100
            : 100;
          const isLowStock = product.stock <= product.safety_stock;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${
                isLowStock ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'
              }`}
            >
              {/* Product Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{product.name}</h4>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
                {isLowStock && (
                  <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                    {ICONS.Alert}
                  </div>
                )}
              </div>

              {/* Stock Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">현재 재고</span>
                  <span className="text-2xl font-black text-slate-800">{product.stock}{product.unit || '포'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">안전재고</span>
                  <span className="font-bold text-slate-700">{product.safety_stock}{product.unit || '포'}</span>
                </div>

                {/* Stock Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLowStock ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Price Info */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    판매단가
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {product.unit_price.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    원가
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {product.cost_price.toLocaleString()}원
                  </div>
                </div>
              </div>

              {/* Stock Adjustment Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleStockAdjustment(product.id, -10)}
                  className="flex-1 py-2 bg-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-200 transition-colors"
                >
                  -10
                </button>
                <button
                  onClick={() => handleStockAdjustment(product.id, -1)}
                  className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  -1
                </button>
                <button
                  onClick={() => handleStockAdjustment(product.id, 1)}
                  className="flex-1 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors"
                >
                  +1
                </button>
                <button
                  onClick={() => handleStockAdjustment(product.id, 10)}
                  className="flex-1 py-2 bg-sky-100 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-200 transition-colors"
                >
                  +10
                </button>
              </div>

              {/* Detail Button */}
              <button
                onClick={() => setDetailProduct(product)}
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 mb-2"
              >
                {ICONS.Trending} 입출고 상세
              </button>

              {/* Edit/Delete Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  {ICONS.Edit} 수정
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1"
                >
                  {ICONS.Delete} 삭제
                </button>
              </div>

              {/* Last Milled Date */}
              {product.last_milled && (
                <div className="mt-3 text-[10px] text-slate-400 text-center">
                  마지막 도정일: {product.last_milled}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Summary Stats by Unit */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-4">재고 요약</h4>

        {/* Unit-based Stats */}
        {(() => {
          const unitGroups = products.reduce((acc: any, product) => {
            const unit = product.unit || '포';
            if (!acc[unit]) {
              acc[unit] = [];
            }
            acc[unit].push(product);
            return acc;
          }, {});

          return (
            <div className="space-y-6">
              {Object.entries(unitGroups).map(([unit, unitProducts]: [string, any]) => (
                <div key={unit} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                  <h5 className="font-bold text-slate-700 mb-3 text-sm">{unit} 단위 재고</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {unit} 재고량
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        {unitProducts.reduce((sum: number, p: any) => sum + p.stock, 0)}{unit}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {unit} 재고 가치
                      </div>
                      <div className="text-xl font-black text-slate-800">
                        {unitProducts.reduce((sum: number, p: any) => sum + (p.stock * p.cost_price), 0).toLocaleString()}원
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        안전재고 이하
                      </div>
                      <div className="text-2xl font-black text-rose-600">
                        {unitProducts.filter((p: any) => p.stock <= p.safety_stock).length}종
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        정상 재고
                      </div>
                      <div className="text-2xl font-black text-emerald-600">
                        {unitProducts.filter((p: any) => p.stock > p.safety_stock).length}종
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl p-4">
                <h5 className="font-bold text-indigo-700 mb-3 text-sm">전체 합계</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                      총 재고 가치
                    </div>
                    <div className="text-2xl font-black text-indigo-700">
                      {products.reduce((sum, p) => sum + (p.stock * p.cost_price), 0).toLocaleString()}원
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                      안전재고 이하
                    </div>
                    <div className="text-2xl font-black text-rose-600">
                      {products.filter(p => p.stock <= p.safety_stock).length}종
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                      정상 재고
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                      {products.filter(p => p.stock > p.safety_stock).length}종
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={loadProducts}
        />
      )}

      {/* Inventory Detail Modal */}
      {detailProduct && (
        <InventoryDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onUpdate={loadProducts}
        />
      )}
    </div>
  );
};

export default InventoryPage;
