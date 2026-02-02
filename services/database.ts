
import { format } from 'date-fns';

// IndexedDB 기반 브라우저 데이터베이스
const DB_NAME = 'RiceShopDB';
const DB_VERSION = 2;

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
          { id: `prod_${Date.now()}_1`, name: '고시히카리', category: '백미', stock: 50, unit_price: 52000, cost_price: 45000, safety_stock: 10, unit: '포' },
          { id: `prod_${Date.now()}_2`, name: '추청(아끼바레)', category: '백미', stock: 80, unit_price: 48000, cost_price: 42000, safety_stock: 15, unit: '포' },
          { id: `prod_${Date.now()}_3`, name: '삼광쌀', category: '백미', stock: 100, unit_price: 45000, cost_price: 39000, safety_stock: 20, unit: '포' },
          { id: `prod_${Date.now()}_4`, name: '오대쌀', category: '백미', stock: 60, unit_price: 44000, cost_price: 38000, safety_stock: 15, unit: '포' },
          { id: `prod_${Date.now()}_5`, name: '안남미', category: '백미', stock: 40, unit_price: 40000, cost_price: 35000, safety_stock: 10, unit: '포' },
          { id: `prod_${Date.now()}_6`, name: '현미', category: '현미', stock: 30, unit_price: 48000, cost_price: 42000, safety_stock: 10, unit: '포' },
        ];

        products.forEach(product => productStore.add(product));
      }

      // 판매 기록
      if (!database.objectStoreNames.contains('sales')) {
        const salesStore = database.createObjectStore('sales', { keyPath: 'id' });
        salesStore.createIndex('date', 'date', { unique: false });
        salesStore.createIndex('customer_id', 'customer_id', { unique: false });
      }

      // 재고 입출고 이력
      if (!database.objectStoreNames.contains('inventory_transactions')) {
        const transactionStore = database.createObjectStore('inventory_transactions', { keyPath: 'id' });
        transactionStore.createIndex('product_id', 'product_id', { unique: false });
        transactionStore.createIndex('date', 'date', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
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
  unit?: string;
}) => {
  const database = await initDatabase();

  const newProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    unit: '포', // 기본값
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
  unit?: string;
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

// 다품종 주문 지원 (신규)
export const addMultiItemSale = async (sale: {
  customer_name: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
  status: string;
  notes?: string;
  date?: string; // 날짜 지정 가능
}) => {
  const database = await initDatabase();

  // 거래처 확인/생성
  const customer = await getOrCreateCustomer(sale.customer_name) as any;

  // 각 품종별로 재고 확인 및 품종 생성
  const processedItems = [];
  let totalAmount = 0;

  for (const item of sale.items) {
    // 기존 품종 확인
    let existingProduct = await getProductByName(item.product_name) as any;

    // 품종 확인/생성
    const product = await getOrCreateProduct(item.product_name, item.unit_price) as any;

    // 새로 생성된 품종인 경우 초기 재고 설정
    const isNewProduct = !existingProduct;
    if (isNewProduct) {
      await updateProduct(product.id, { stock: item.quantity + 50 });
      existingProduct = await getProductByName(item.product_name) as any;
    }

    // 재고 확인
    const currentProduct = existingProduct || product;
    if (currentProduct.stock < item.quantity) {
      throw new Error(`${item.product_name} 재고 부족! 현재 ${currentProduct.stock}포만 남았습니다.`);
    }

    processedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price
    });

    totalAmount += item.quantity * item.unit_price;
  }

  const newSale = {
    id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: sale.date || format(new Date(), 'yyyy-MM-dd'),
    customer_id: customer.id,
    customer_name: customer.name,
    items: processedItems, // 다품종 항목
    total_amount: totalAmount,
    status: sale.status,
    notes: sale.notes || null,
    is_multi_item: true, // 다품종 주문 표시
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

      // 각 품종별 재고 차감 및 출고 이력 생성
      const warnings = [];
      for (const item of processedItems) {
        await updateProductStock(item.product_id, -item.quantity);

        // 출고 이력 자동 생성
        await addInventoryTransaction({
          product_id: item.product_id,
          product_name: item.product_name,
          date: newSale.date,
          quantity: item.quantity,
          unit_price: item.unit_price,
          type: 'out',
          notes: `판매 - ${customer.name}`,
          related_sale_id: newSale.id
        });

        // 안전재고 확인
        const updatedProduct = await getProductByName(item.product_name) as any;
        if (updatedProduct && updatedProduct.stock <= updatedProduct.safety_stock) {
          warnings.push(`⚠️ ${item.product_name} 재고가 안전재고(${updatedProduct.safety_stock}포) 이하입니다! (현재: ${updatedProduct.stock}포)`);
        }
      }

      // 미결제인 경우 미수금 업데이트
      if (sale.status === '미결제') {
        await updateCustomer(customer.id, { balance: customer.balance + totalAmount });
      }

      if (warnings.length > 0) {
        resolve({
          success: true,
          id: newSale.id,
          warning: warnings.join('\n')
        });
      } else {
        resolve({ success: true, id: newSale.id });
      }
    } catch (error) {
      reject(error);
    }
  });
};

// 단일 품종 주문 (기존 호환성 유지)
export const addSale = async (sale: {
  customer_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  status: string;
  notes?: string;
  date?: string; // 날짜 지정 가능
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
    date: sale.date || format(new Date(), 'yyyy-MM-dd'), // 날짜 지정 가능
    customer_id: customer.id,
    customer_name: customer.name,
    product_id: product.id,
    product_name: product.name,
    quantity: sale.quantity,
    unit_price: sale.unit_price,
    total_amount: sale.quantity * sale.unit_price,
    status: sale.status,
    notes: sale.notes || null,
    is_multi_item: false, // 단일 품종
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

      // 출고 이력 자동 생성
      await addInventoryTransaction({
        product_id: product.id,
        product_name: product.name,
        date: newSale.date,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        type: 'out',
        notes: `판매 - ${customer.name}`,
        related_sale_id: newSale.id
      });

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
  date?: string;
  items?: Array<{ product_name: string; quantity: number; unit_price: number; unit?: string }>;
  is_multi_item?: boolean;
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

    // 다품종 수정인 경우
    if (updates.items && updates.items.length > 0) {
      // 기존 재고 복원 및 출고 이력 삭제
      if (oldSale.is_multi_item && oldSale.items) {
        for (const item of oldSale.items) {
          const product = await getProductByName(item.product_name) as any;
          if (product) {
            await updateProductStock(product.id, item.quantity);
          }
        }
      } else {
        await updateProductStock(oldSale.product_id, oldSale.quantity);
      }

      // 기존 출고 이력 삭제 (직접 삭제 - 판매 수정 시에만 허용)
      const allTransactions = await getAllInventoryTransactions() as any[];
      const relatedTransactions = allTransactions.filter((t: any) => t.related_sale_id === saleId);
      for (const trans of relatedTransactions) {
        const transactionTx = database.transaction(['inventory_transactions'], 'readwrite');
        const transactionStore = transactionTx.objectStore('inventory_transactions');
        transactionStore.delete(trans.id);
      }

      // 새 품종들 처리 및 재고 차감
      const processedItems = [];
      for (const item of updates.items) {
        const product = await getOrCreateProduct(item.product_name, item.unit_price) as any;
        await updateProductStock(product.id, -item.quantity);
        processedItems.push({
          product_id: product.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit: item.unit || '포'
        });
      }

      // 거래처 처리
      const customer = updates.customer_name
        ? await getOrCreateCustomer(updates.customer_name) as any
        : await new Promise<any>(async (resolve) => {
            const customers = await getAllCustomers() as any[];
            resolve(customers.find((c: any) => c.id === oldSale.customer_id));
          });

      // 총액 계산
      const newTotal = processedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // 미수금 조정
      if (oldSale.status === '미결제') {
        const oldCustomer = await new Promise<any>(async (resolve) => {
          const customers = await getAllCustomers() as any[];
          resolve(customers.find((c: any) => c.id === oldSale.customer_id));
        });
        if (oldCustomer) {
          await updateCustomer(oldCustomer.id, { balance: oldCustomer.balance - oldSale.total_amount });
        }
      }

      if (updates.status === '미결제' || (!updates.status && oldSale.status === '미결제')) {
        if (customer) {
          await updateCustomer(customer.id, { balance: customer.balance + newTotal });
        }
      }

      // 판매 기록 업데이트
      oldSale.customer_id = customer.id;
      oldSale.customer_name = customer.name;
      oldSale.items = processedItems;
      oldSale.is_multi_item = true;
      oldSale.total_amount = newTotal;
      oldSale.status = updates.status || oldSale.status;
      oldSale.notes = updates.notes !== undefined ? updates.notes : oldSale.notes;
      oldSale.date = updates.date || oldSale.date;

      // 새 출고 이력 생성
      for (const item of processedItems) {
        await addInventoryTransaction({
          product_id: item.product_id,
          product_name: item.product_name,
          date: oldSale.date,
          quantity: item.quantity,
          unit_price: item.unit_price,
          type: 'out',
          notes: `판매 - ${customer.name}`,
          related_sale_id: saleId
        });
      }

      // 단일 품목 필드는 undefined로 설정
      oldSale.product_id = undefined;
      oldSale.product_name = undefined;
      oldSale.quantity = undefined;
      oldSale.unit_price = undefined;

    } else {
      // 단일 품목 수정 (기존 로직 유지)
      const customerChanged = updates.customer_name !== undefined && updates.customer_name !== oldSale.customer_name;
      const productChanged = updates.product_name !== undefined && updates.product_name !== oldSale.product_name;
      const quantityChanged = updates.quantity !== undefined && updates.quantity !== oldSale.quantity;
      const statusChanged = updates.status !== undefined && updates.status !== oldSale.status;
      const priceChanged = updates.unit_price !== undefined && updates.unit_price !== oldSale.unit_price;
      const dateChanged = updates.date !== undefined && updates.date !== oldSale.date;

      // 상태만 변경하는 경우 (다른 필드는 변경하지 않음)
      const onlyStatusChanged = statusChanged && !customerChanged && !productChanged && !quantityChanged && !priceChanged && !dateChanged;

      let newCustomer = null;
      if (customerChanged) {
        newCustomer = await getOrCreateCustomer(updates.customer_name!) as any;
      }

      let newProduct = null;
      if (productChanged) {
        newProduct = await getOrCreateProduct(updates.product_name!, updates.unit_price || oldSale.unit_price) as any;
      }

      // 기존 재고 복원
      if (oldSale.is_multi_item && oldSale.items) {
        for (const item of oldSale.items) {
          const product = await getProductByName(item.product_name) as any;
          if (product) {
            await updateProductStock(product.id, item.quantity);
          }
        }
        // 기존 출고 이력 삭제 (다품종)
        const allTransactions = await getAllInventoryTransactions() as any[];
        const relatedTransactions = allTransactions.filter((t: any) => t.related_sale_id === saleId);
        for (const trans of relatedTransactions) {
          const transactionStore = database.transaction(['inventory_transactions'], 'readwrite').objectStore('inventory_transactions');
          transactionStore.delete(trans.id);
        }
      } else if (productChanged) {
        await updateProductStock(oldSale.product_id, oldSale.quantity);
        // 기존 출고 이력 삭제 (품종 변경)
        const existingTransactions = await getInventoryTransactionsByProduct(oldSale.product_id) as any[];
        const relatedTransactions = existingTransactions.filter((t: any) => t.related_sale_id === saleId);
        for (const trans of relatedTransactions) {
          const transactionStore = database.transaction(['inventory_transactions'], 'readwrite').objectStore('inventory_transactions');
          transactionStore.delete(trans.id);
        }
      } else if (quantityChanged) {
        const diff = oldSale.quantity - updates.quantity!;
        await updateProductStock(oldSale.product_id, diff);
        // 출고 이력 수량 업데이트
        const existingTransactions = await getInventoryTransactionsByProduct(oldSale.product_id) as any[];
        const relatedTransaction = existingTransactions.find((t: any) => t.related_sale_id === saleId);
        if (relatedTransaction) {
          relatedTransaction.quantity = updates.quantity;
          relatedTransaction.total_cost = updates.quantity * (updates.unit_price || oldSale.unit_price);
          const transactionStore = database.transaction(['inventory_transactions'], 'readwrite').objectStore('inventory_transactions');
          transactionStore.put(relatedTransaction);
        }
      }

      // 단가나 날짜만 변경된 경우 출고 이력 업데이트
      if ((priceChanged || dateChanged) && !quantityChanged && !productChanged) {
        const existingTransactions = await getInventoryTransactionsByProduct(oldSale.product_id) as any[];
        const relatedTransaction = existingTransactions.find((t: any) => t.related_sale_id === saleId);
        if (relatedTransaction) {
          if (priceChanged) {
            relatedTransaction.unit_price = updates.unit_price;
            relatedTransaction.total_cost = oldSale.quantity * updates.unit_price;
          }
          if (dateChanged) {
            relatedTransaction.date = updates.date;
          }
          const transactionStore = database.transaction(['inventory_transactions'], 'readwrite').objectStore('inventory_transactions');
          transactionStore.put(relatedTransaction);
        }
      }

      // 새 품종에 재고 차감
      if (productChanged && newProduct) {
        await updateProductStock(newProduct.id, -(updates.quantity || oldSale.quantity));
      }

      // 미수금 조정
      if (customerChanged || statusChanged || priceChanged || quantityChanged) {
        const oldCustomerId = oldSale.customer_id;
        const newCustomerId = newCustomer ? newCustomer.id : oldCustomerId;
        const newStatus = updates.status || oldSale.status;
        const newTotal = (updates.quantity || oldSale.quantity) * (updates.unit_price || oldSale.unit_price);

        if (oldSale.status === '미결제') {
          const customers = await getAllCustomers() as any[];
          const oldCustomer = customers.find((c: any) => c.id === oldCustomerId);
          if (oldCustomer) {
            await updateCustomer(oldCustomer.id, { balance: oldCustomer.balance - oldSale.total_amount });
          }
        }

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

        // 새 품종에 대한 출고 이력 생성
        const finalCustomer = newCustomer || await new Promise<any>(async (resolve) => {
          const customers = await getAllCustomers() as any[];
          resolve(customers.find((c: any) => c.id === oldSale.customer_id));
        });

        await addInventoryTransaction({
          product_id: newProduct.id,
          product_name: newProduct.name,
          date: updates.date || oldSale.date,
          quantity: updates.quantity || oldSale.quantity,
          unit_price: updates.unit_price || oldSale.unit_price,
          type: 'out',
          notes: `판매 - ${finalCustomer.name}`,
          related_sale_id: saleId
        });
      }
      if (updates.quantity !== undefined) oldSale.quantity = updates.quantity;
      if (updates.unit_price !== undefined) oldSale.unit_price = updates.unit_price;
      if (updates.status !== undefined) oldSale.status = updates.status;
      if (updates.notes !== undefined) oldSale.notes = updates.notes;
      if (updates.date !== undefined) oldSale.date = updates.date;

      // 상태만 변경하는 경우에는 total_amount, is_multi_item, items를 건드리지 않음
      if (!onlyStatusChanged) {
        // 단일 품목의 경우 total_amount 재계산
        if (!oldSale.is_multi_item && oldSale.quantity !== undefined && oldSale.unit_price !== undefined) {
          oldSale.total_amount = oldSale.quantity * oldSale.unit_price;
        }
        oldSale.is_multi_item = false;
        oldSale.items = undefined;
      }
    }

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
    if (sale.is_multi_item && sale.items) {
      // 다품종인 경우
      for (const item of sale.items) {
        const product = await getProductByName(item.product_name) as any;
        if (product) {
          await updateProductStock(product.id, item.quantity);
        }
      }
    } else {
      // 단일 품종인 경우
      await updateProductStock(sale.product_id, sale.quantity);
    }

    // 관련 출고 이력 삭제
    const allTransactions = await getAllInventoryTransactions() as any[];
    const relatedTransactions = allTransactions.filter((t: any) => t.related_sale_id === saleId);
    for (const trans of relatedTransactions) {
      const transactionTx = database.transaction(['inventory_transactions'], 'readwrite');
      const transactionStore = transactionTx.objectStore('inventory_transactions');
      transactionStore.delete(trans.id);
    }

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

// ==================== 재고 입출고 이력 관리 ====================

// 재고 이력 추가
export const addInventoryTransaction = async (transaction: {
  product_id: string;
  product_name: string;
  date: string;
  quantity: number;
  unit_price: number;
  type: 'in' | 'out';
  notes?: string;
  related_sale_id?: string; // 판매 기록과 연결 (출고의 경우)
}) => {
  const database = await initDatabase();

  const newTransaction = {
    id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...transaction,
    total_cost: transaction.quantity * transaction.unit_price,
    created_at: new Date().toISOString()
  };

  // 입고인 경우 재고 증가
  if (transaction.type === 'in') {
    await updateProductStock(transaction.product_id, transaction.quantity);
  }

  return new Promise((resolve, reject) => {
    const tx = database.transaction(['inventory_transactions'], 'readwrite');
    const store = tx.objectStore('inventory_transactions');
    const addRequest = store.add(newTransaction);

    addRequest.onsuccess = () => resolve(newTransaction);
    addRequest.onerror = () => reject(addRequest.error);
  });
};

// 제품별 재고 이력 조회
export const getInventoryTransactionsByProduct = async (productId: string) => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory_transactions'], 'readonly');
    const store = transaction.objectStore('inventory_transactions');
    const index = store.index('product_id');
    const request = index.getAll(productId);

    request.onsuccess = () => {
      const transactions = request.result;
      // 날짜 내림차순 정렬 (최신순)
      transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(transactions);
    };
    request.onerror = () => reject(request.error);
  });
};

// 모든 재고 이력 조회
export const getAllInventoryTransactions = async () => {
  const database = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory_transactions'], 'readonly');
    const store = transaction.objectStore('inventory_transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      const transactions = request.result;
      transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(transactions);
    };
    request.onerror = () => reject(request.error);
  });
};

// 재고 이력 수정
export const updateInventoryTransaction = async (transactionId: string, updates: {
  date?: string;
  quantity?: number;
  unit_price?: number;
  notes?: string;
}) => {
  const database = await initDatabase();

  try {
    // 기존 이력 가져오기
    const oldTransaction = await new Promise<any>((resolve, reject) => {
      const transaction = database.transaction(['inventory_transactions'], 'readonly');
      const store = transaction.objectStore('inventory_transactions');
      const getRequest = store.get(transactionId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!oldTransaction) {
      throw new Error('Transaction not found');
    }

    // 출고 이력은 수정 불가 (판매 기록과 연결되어 있음)
    if (oldTransaction.type === 'out') {
      throw new Error('출고 이력은 수정할 수 없습니다. 판매 기록을 수정해주세요.');
    }

    // 재고 조정: 이전 수량 복원 + 새 수량 적용
    if (updates.quantity !== undefined && updates.quantity !== oldTransaction.quantity) {
      const quantityDiff = updates.quantity - oldTransaction.quantity;
      await updateProductStock(oldTransaction.product_id, quantityDiff);
    }

    // 업데이트 적용
    const updatedTransaction = {
      ...oldTransaction,
      ...updates,
      total_cost: (updates.quantity || oldTransaction.quantity) * (updates.unit_price || oldTransaction.unit_price)
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['inventory_transactions'], 'readwrite');
      const store = transaction.objectStore('inventory_transactions');
      const updateRequest = store.put(updatedTransaction);
      updateRequest.onsuccess = () => resolve(updatedTransaction);
      updateRequest.onerror = () => reject(updateRequest.error);
    });
  } catch (error) {
    throw error;
  }
};

// 재고 이력 삭제
export const deleteInventoryTransaction = async (transactionId: string) => {
  const database = await initDatabase();

  try {
    // 기존 이력 가져오기
    const transaction = await new Promise<any>((resolve, reject) => {
      const tx = database.transaction(['inventory_transactions'], 'readonly');
      const store = tx.objectStore('inventory_transactions');
      const getRequest = store.get(transactionId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 출고 이력은 삭제 불가
    if (transaction.type === 'out') {
      throw new Error('출고 이력은 삭제할 수 없습니다. 판매 기록을 삭제해주세요.');
    }

    // 재고 복원 (입고 취소)
    await updateProductStock(transaction.product_id, -transaction.quantity);

    // 이력 삭제
    return new Promise((resolve, reject) => {
      const tx = database.transaction(['inventory_transactions'], 'readwrite');
      const store = tx.objectStore('inventory_transactions');
      const deleteRequest = store.delete(transactionId);
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (error) {
    throw error;
  }
};
