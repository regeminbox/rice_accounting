
import { format } from 'date-fns';

// IndexedDB 기반 브라우저 데이터베이스
const DB_NAME = 'RiceShopDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

// 데이터베이스 초기화
export const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;

      // 사용자 프로필
      if (!database.objectStoreNames.contains('user_profile')) {
        database.createObjectStore('user_profile', { keyPath: 'id', autoIncrement: true });
      }

      // 거래처
      if (!database.objectStoreNames.contains('customers')) {
        const customerStore = database.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: true });
      }

      // 품종
      if (!database.objectStoreNames.contains('products')) {
        const productStore = database.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('name', 'name', { unique: true });

        // 초기 데이터 추가 (onupgradeneeded 트랜잭션 내에서)
        const products = [
          { id: `prod_${Date.now()}_1`, name: '고시히카리', category: '백미', stock: 50, unit_price: 52000, cost_price: 45000, safety_stock: 10 },
          { id: `prod_${Date.now()}_2`, name: '추청(아끼바레)', category: '백미', stock: 80, unit_price: 48000, cost_price: 42000, safety_stock: 15 },
          { id: `prod_${Date.now()}_3`, name: '삼광쌀', category: '백미', stock: 100, unit_price: 45000, cost_price: 39000, safety_stock: 20 },
          { id: `prod_${Date.now()}_4`, name: '오대쌀', category: '백미', stock: 60, unit_price: 44000, cost_price: 38000, safety_stock: 15 },
          { id: `prod_${Date.now()}_5`, name: '안남미', category: '백미', stock: 40, unit_price: 40000, cost_price: 35000, safety_stock: 10 },
          { id: `prod_${Date.now()}_6`, name: '현미', category: '현미', stock: 30, unit_price: 48000, cost_price: 42000, safety_stock: 10 },
        ];

        products.forEach(product => productStore.add(product));
      }

      // 판매 기록
      if (!database.objectStoreNames.contains('sales')) {
        const salesStore = database.createObjectStore('sales', { keyPath: 'id' });
        salesStore.createIndex('date', 'date', { unique: false });
        salesStore.createIndex('customer_id', 'customer_id', { unique: false });
      }
    };
  });
};

// 사용자 프로필
export const getUserProfile = async () => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['user_profile'], 'readonly');
    const store = transaction.objectStore('user_profile');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result[0] || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveUserProfile = async (profile: any) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['user_profile'], 'readwrite');
    const store = transaction.objectStore('user_profile');

    // 기존 데이터 삭제
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      const addRequest = store.add(profile);
      addRequest.onsuccess = () => resolve(addRequest.result);
      addRequest.onerror = () => reject(addRequest.error);
    };
  });
};

// 거래처
export const getAllCustomers = async () => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getOrCreateCustomer = async (name: string) => {
  const database = await initDatabase();
  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    const index = store.index('name');
    const getRequest = index.get(name);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        resolve(getRequest.result);
      } else {
        const newCustomer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          contact: '',
          address: '',
          balance: 0,
          created_at: new Date().toISOString()
        };
        const addRequest = store.add(newCustomer);
        addRequest.onsuccess = () => resolve(newCustomer);
        addRequest.onerror = () => reject(addRequest.error);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const updateCustomer = async (customerId: string, updates: {
  name?: string;
  contact?: string;
  address?: string;
  balance?: number;
}) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    const getRequest = store.get(customerId);

    getRequest.onsuccess = () => {
      const customer = getRequest.result;
      if (customer) {
        Object.assign(customer, updates);
        const updateRequest = store.put(customer);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Customer not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const deleteCustomer = async (customerId: string) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    const deleteRequest = store.delete(customerId);

    deleteRequest.onsuccess = () => resolve(true);
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};

// 품종
export const getAllProducts = async () => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getProductByName = async (name: string) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('name');
    const request = index.get(name);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const addProduct = async (product: {
  name: string;
  category: string;
  stock: number;
  unit_price: number;
  cost_price: number;
  safety_stock: number;
}) => {
  const database = await initDatabase();

  const newProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...product
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const addRequest = store.add(newProduct);

    addRequest.onsuccess = () => resolve(newProduct);
    addRequest.onerror = () => reject(addRequest.error);
  });
};

export const getOrCreateProduct = async (name: string, unitPrice?: number) => {
  const database = await initDatabase();
  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const index = store.index('name');
    const getRequest = index.get(name);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        resolve(getRequest.result);
      } else {
        const newProduct = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          category: '백미',
          stock: 0,
          unit_price: unitPrice || 45000,
          cost_price: unitPrice ? Math.floor(unitPrice * 0.85) : 39000,
          safety_stock: 10
        };
        const addRequest = store.add(newProduct);
        addRequest.onsuccess = () => resolve(newProduct);
        addRequest.onerror = () => reject(addRequest.error);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const updateProductStock = async (productId: string, quantityChange: number) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const getRequest = store.get(productId);

    getRequest.onsuccess = () => {
      const product = getRequest.result;
      if (product) {
        product.stock += quantityChange;
        const updateRequest = store.put(product);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Product not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const updateProduct = async (productId: string, updates: {
  name?: string;
  category?: string;
  stock?: number;
  unit_price?: number;
  cost_price?: number;
  safety_stock?: number;
}) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const getRequest = store.get(productId);

    getRequest.onsuccess = () => {
      const product = getRequest.result;
      if (product) {
        Object.assign(product, updates);
        const updateRequest = store.put(product);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Product not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const deleteProduct = async (productId: string) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const deleteRequest = store.delete(productId);

    deleteRequest.onsuccess = () => resolve(true);
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};

// 판매 기록
export const getAllSales = async () => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const request = store.getAll();

    request.onsuccess = () => {
      const sales = request.result.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(sales);
    };
    request.onerror = () => reject(request.error);
  });
};

export const addSale = async (sale: {
  customer_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  status: string;
  notes?: string;
}) => {
  const database = await initDatabase();

  // 거래처 확인/생성
  const customer = await getOrCreateCustomer(sale.customer_name) as any;

  // 기존 품종 확인
  let existingProduct = await getProductByName(sale.product_name) as any;

  // 품종 확인/생성
  const product = await getOrCreateProduct(sale.product_name, sale.unit_price) as any;

  // 새로 생성된 품종인 경우 초기 재고 설정
  const isNewProduct = !existingProduct;
  if (isNewProduct) {
    await updateProduct(product.id, { stock: sale.quantity + 50 });
    // 재고 업데이트 후 다시 가져오기
    existingProduct = await getProductByName(sale.product_name) as any;
  }

  // 재고 확인
  const currentProduct = existingProduct || product;
  if (currentProduct.stock < sale.quantity) {
    throw new Error(`재고 부족! 현재 ${currentProduct.stock}포만 남았습니다.`);
  }

  const newSale = {
    id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: format(new Date(), 'yyyy-MM-dd'),
    customer_id: customer.id,
    customer_name: customer.name,
    product_id: product.id,
    product_name: product.name,
    quantity: sale.quantity,
    unit_price: sale.unit_price,
    total_amount: sale.quantity * sale.unit_price,
    status: sale.status,
    notes: sale.notes || null,
    created_at: new Date().toISOString()
  };

  return new Promise(async (resolve, reject) => {
    try {
      // 판매 기록 추가
      const transaction = database.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const addRequest = store.add(newSale);

      await new Promise((res, rej) => {
        addRequest.onsuccess = () => res(addRequest.result);
        addRequest.onerror = () => rej(addRequest.error);
      });

      // 재고 차감
      await updateProductStock(product.id, -sale.quantity);

      // 미결제인 경우 미수금 업데이트
      if (sale.status === '미결제') {
        await updateCustomer(customer.id, { balance: customer.balance + newSale.total_amount });
      }

      // 안전재고 확인
      const updatedProduct = await getProductByName(sale.product_name) as any;
      if (updatedProduct && updatedProduct.stock <= updatedProduct.safety_stock) {
        resolve({
          success: true,
          id: newSale.id,
          warning: `⚠️ ${product.name} 재고가 안전재고(${product.safety_stock}포) 이하입니다! (현재: ${updatedProduct.stock}포)`
        });
      } else {
        resolve({ success: true, id: newSale.id });
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const updateSale = async (saleId: string, updates: {
  customer_name?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  status?: string;
  notes?: string;
}) => {
  const database = await initDatabase();

  try {
    // 먼저 기존 판매 정보를 가져옴
    const oldSale = await new Promise<any>((resolve, reject) => {
      const transaction = database.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const getRequest = store.get(saleId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!oldSale) {
      throw new Error('Sale not found');
    }

    // 변경 사항 확인
    const customerChanged = updates.customer_name !== undefined && updates.customer_name !== oldSale.customer_name;
    const productChanged = updates.product_name !== undefined && updates.product_name !== oldSale.product_name;
    const quantityChanged = updates.quantity !== undefined && updates.quantity !== oldSale.quantity;
    const statusChanged = updates.status !== undefined && updates.status !== oldSale.status;
    const priceChanged = updates.unit_price !== undefined && updates.unit_price !== oldSale.unit_price;

    // 거래처가 변경된 경우
    let newCustomer = null;
    if (customerChanged) {
      newCustomer = await getOrCreateCustomer(updates.customer_name!) as any;
    }

    // 품종이 변경된 경우
    let newProduct = null;
    if (productChanged) {
      newProduct = await getOrCreateProduct(updates.product_name!, updates.unit_price || oldSale.unit_price) as any;
    }

    // 기존 재고 복원 (품종 변경 또는 수량 변경 시)
    if (productChanged) {
      await updateProductStock(oldSale.product_id, oldSale.quantity);
    } else if (quantityChanged) {
      const diff = oldSale.quantity - updates.quantity!;
      await updateProductStock(oldSale.product_id, diff);
    }

    // 새 품종에 재고 차감 (품종 변경 시)
    if (productChanged && newProduct) {
      await updateProductStock(newProduct.id, -(updates.quantity || oldSale.quantity));
    }

    // 미수금 조정
    if (customerChanged || statusChanged || priceChanged || quantityChanged) {
      const oldCustomerId = oldSale.customer_id;
      const newCustomerId = newCustomer ? newCustomer.id : oldCustomerId;
      const newStatus = updates.status || oldSale.status;
      const newTotal = (updates.quantity || oldSale.quantity) * (updates.unit_price || oldSale.unit_price);

      // 기존 미수금 차감 (기존 상태가 미결제였던 경우)
      if (oldSale.status === '미결제') {
        const customers = await getAllCustomers() as any[];
        const oldCustomer = customers.find((c: any) => c.id === oldCustomerId);
        if (oldCustomer) {
          await updateCustomer(oldCustomer.id, { balance: oldCustomer.balance - oldSale.total_amount });
        }
      }

      // 새 미수금 추가 (새 상태가 미결제인 경우)
      if (newStatus === '미결제') {
        const customers = await getAllCustomers() as any[];
        const targetCustomer = customers.find((c: any) => c.id === newCustomerId);
        if (targetCustomer) {
          await updateCustomer(targetCustomer.id, { balance: targetCustomer.balance + newTotal });
        }
      }
    }

    // 판매 기록 업데이트
    if (customerChanged && newCustomer) {
      oldSale.customer_id = newCustomer.id;
      oldSale.customer_name = newCustomer.name;
    }
    if (productChanged && newProduct) {
      oldSale.product_id = newProduct.id;
      oldSale.product_name = newProduct.name;
    }
    if (updates.quantity !== undefined) oldSale.quantity = updates.quantity;
    if (updates.unit_price !== undefined) oldSale.unit_price = updates.unit_price;
    if (updates.status !== undefined) oldSale.status = updates.status;
    if (updates.notes !== undefined) oldSale.notes = updates.notes;

    oldSale.total_amount = oldSale.quantity * oldSale.unit_price;

    // 업데이트 저장
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const updateRequest = store.put(oldSale);
      updateRequest.onsuccess = () => resolve(updateRequest.result);
      updateRequest.onerror = () => reject(updateRequest.error);
    });
  } catch (error) {
    throw error;
  }
};

export const deleteSale = async (saleId: string) => {
  const database = await initDatabase();

  try {
    // 먼저 판매 정보를 가져옴
    const sale = await new Promise<any>((resolve, reject) => {
      const transaction = database.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const getRequest = store.get(saleId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    // 재고 복원
    await updateProductStock(sale.product_id, sale.quantity);

    // 미수금 차감
    if (sale.status === '미결제') {
      const customers = await getAllCustomers() as any[];
      const customer = customers.find((c: any) => c.id === sale.customer_id);

      if (customer) {
        await updateCustomer(customer.id, { balance: customer.balance - sale.total_amount });
      }
    }

    // 판매 기록 삭제
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const deleteRequest = store.delete(saleId);
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (error) {
    throw error;
  }
};

// 미수금 리셋 및 재계산 (모든 판매 기록을 기반으로 미수금 재계산)
export const resetAllBalances = async () => {
  const database = await initDatabase();
  const customers = await getAllCustomers() as any[];
  const sales = await getAllSales() as any[];

  // 모든 고객의 balance를 0으로 초기화
  for (const customer of customers) {
    await updateCustomer(customer.id, { balance: 0 });
  }

  // 미결제 상태인 판매 기록만 집계하여 balance 재계산
  const balanceMap = new Map<string, number>();

  for (const sale of sales) {
    if (sale.status === '미결제') {
      const currentBalance = balanceMap.get(sale.customer_id) || 0;
      balanceMap.set(sale.customer_id, currentBalance + sale.total_amount);
    }
  }

  // 계산된 balance를 각 고객에게 업데이트
  for (const [customerId, balance] of balanceMap.entries()) {
    await updateCustomer(customerId, { balance });
  }

  return { success: true, message: '모든 미수금이 재계산되었습니다.' };
};

// 대시보드 통계
export const getDashboardStats = async () => {
  const sales = await getAllSales() as any[];
  const customers = await getAllCustomers() as any[];
  const products = await getAllProducts() as any[];
  const today = format(new Date(), 'yyyy-MM-dd');

  // 오늘 매출
  const todaySales = sales
    .filter((s: any) => s.date === today)
    .reduce((sum: number, s: any) => sum + s.total_amount, 0);

  // 총 미수금
  const totalUnpaid = customers.reduce((sum: number, c: any) => sum + (c.balance || 0), 0);

  // 오늘 주문 건수
  const todayOrders = sales.filter((s: any) => s.date === today).length;

  // 안전재고 이하 품종 수
  const lowStockCount = products.filter((p: any) => p.stock <= p.safety_stock).length;

  return {
    todaySales,
    totalUnpaid,
    todayOrders,
    lowStockCount
  };
};

// 상위 거래처 조회
export const getTopCustomers = async (limit: number = 5) => {
  const sales = await getAllSales() as any[];
  const customers = await getAllCustomers() as any[];

  const customerStats = customers.map((customer: any) => {
    const customerSales = sales.filter((s: any) => s.customer_id === customer.id);
    return {
      id: customer.id,
      name: customer.name,
      order_count: customerSales.length,
      total_sales: customerSales.reduce((sum: number, s: any) => sum + s.total_amount, 0),
      unpaid_amount: customer.balance || 0
    };
  });

  return customerStats
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, limit);
};

// 주간 매출 데이터 조회 (최근 7일)
export const getWeeklySalesData = async () => {
  const sales = await getAllSales() as any[];
  const result: { [key: string]: number } = {};

  // 최근 7일 날짜 생성
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    result[dateStr] = 0;
  }

  // 판매 데이터 집계
  sales.forEach((sale: any) => {
    if (result.hasOwnProperty(sale.date)) {
      result[sale.date] += sale.total_amount;
    }
  });

  // 차트용 데이터 형식으로 변환
  return Object.entries(result).map(([date, sales]) => ({
    name: format(new Date(date), 'MM/dd'),
    sales
  }));
};

// AI 인사이트 생성 (실시간 분석)
export const getRealtimeInsights = async () => {
  const sales = await getAllSales() as any[];
  const products = await getAllProducts() as any[];
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // 오늘 판매 데이터
  const todaySales = sales.filter(s => s.date === today);
  const yesterdaySales = sales.filter(s => s.date === yesterday);

  // 품종별 오늘 판매량
  const productSalesToday: { [key: string]: number } = {};
  todaySales.forEach(sale => {
    productSalesToday[sale.product_name] = (productSalesToday[sale.product_name] || 0) + sale.quantity;
  });

  // 품종별 어제 판매량
  const productSalesYesterday: { [key: string]: number } = {};
  yesterdaySales.forEach(sale => {
    productSalesYesterday[sale.product_name] = (productSalesYesterday[sale.product_name] || 0) + sale.quantity;
  });

  // 인사이트 생성
  let mainInsight = '';
  let sidebarInsight = '';

  // 1. 재고 부족 경고 (최우선)
  const lowStockProducts = products.filter(p => p.stock <= p.safety_stock);
  if (lowStockProducts.length > 0) {
    const product = lowStockProducts[0];
    mainInsight = `⚠️ ${product.name} 재고가 안전재고(${product.safety_stock}포) 이하입니다! 현재 ${product.stock}포만 남았습니다. 추가 도정을 준비하세요.`;
    sidebarInsight = `${product.name} 재고 부족 경고 (${product.stock}포)`;
  }
  // 2. 오늘 판매량 급증/급감
  else if (Object.keys(productSalesToday).length > 0) {
    let maxIncrease = 0;
    let maxIncreaseProduct = '';

    Object.keys(productSalesToday).forEach(productName => {
      const todayQty = productSalesToday[productName];
      const yesterdayQty = productSalesYesterday[productName] || 0;

      if (yesterdayQty > 0) {
        const increase = ((todayQty - yesterdayQty) / yesterdayQty) * 100;
        if (increase > maxIncrease) {
          maxIncrease = increase;
          maxIncreaseProduct = productName;
        }
      } else if (todayQty > 0) {
        maxIncrease = 100;
        maxIncreaseProduct = productName;
      }
    });

    if (maxIncrease > 20) {
      mainInsight = `📈 오늘 ${maxIncreaseProduct} 판매량이 어제보다 ${Math.round(maxIncrease)}% 증가했습니다! 수요가 늘고 있으니 재고를 확인하세요.`;
      sidebarInsight = `${maxIncreaseProduct} 판매량 ${Math.round(maxIncrease)}% 증가`;
    } else if (todaySales.length > 0) {
      mainInsight = `💼 오늘 ${todaySales.length}건의 주문이 들어왔습니다. 총 매출 ${todaySales.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}원을 달성했어요!`;
      sidebarInsight = `오늘 ${todaySales.length}건 주문 접수`;
    } else {
      mainInsight = `📊 오늘 아직 주문이 없습니다. 거래처에 연락하거나 프로모션을 고려해보세요.`;
      sidebarInsight = `대기 중 - 신규 주문 없음`;
    }
  }
  // 3. 미수금 경고
  else {
    const customers = await getAllCustomers() as any[];
    const totalUnpaid = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    if (totalUnpaid > 0) {
      mainInsight = `💰 현재 총 미수금이 ${totalUnpaid.toLocaleString()}원 입니다. 거래처별 미수금을 확인하고 수금 계획을 세워보세요.`;
      sidebarInsight = `총 미수금 ${totalUnpaid.toLocaleString()}원`;
    } else {
      mainInsight = `✅ 모든 거래가 정상적으로 진행되고 있습니다. 재고와 판매 현황을 계속 모니터링하세요.`;
      sidebarInsight = `정상 운영 중`;
    }
  }

  return {
    mainInsight,
    sidebarInsight
  };
};

// 백업 (localStorage 활용)
export const createBackup = async () => {
  const sales = await getAllSales();
  const customers = await getAllCustomers();
  const products = await getAllProducts();
  const userProfile = await getUserProfile();

  const backup = {
    sales,
    customers,
    products,
    userProfile,
    timestamp: new Date().toISOString()
  };

  const backupKey = `backup_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
  localStorage.setItem(backupKey, JSON.stringify(backup));

  return backupKey;
};
