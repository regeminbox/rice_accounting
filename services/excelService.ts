
import * as XLSX from 'xlsx';
import { addSale, getAllSales, getAllProducts, getAllCustomers } from './database';
import { format } from 'date-fns';

// 판매 데이터를 엑셀로 내보내기
export const exportSalesToExcel = (sales: any[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    sales.map((sale) => ({
      '일자': sale.date,
      '거래처': sale.customer_name,
      '품종': sale.product_name,
      '수량': sale.quantity,
      '단가': sale.unit_price,
      '총액': sale.total_amount,
      '상태': sale.status,
      '비고': sale.notes || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '판매내역');

  // 파일명에 날짜 포함
  const filename = `판매내역_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
};

// 거래처 데이터를 엑셀로 내보내기
export const exportCustomersToExcel = async () => {
  const customers = await getAllCustomers() as any[];

  const worksheet = XLSX.utils.json_to_sheet(
    customers.map((customer) => ({
      '거래처명': customer.name,
      '연락처': customer.contact || '',
      '주소': customer.address || '',
      '미수금': customer.balance,
      '등록일': customer.created_at
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '거래처');

  const filename = `거래처_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
};

// 재고 데이터를 엑셀로 내보내기
export const exportInventoryToExcel = async () => {
  const products = await getAllProducts() as any[];

  const worksheet = XLSX.utils.json_to_sheet(
    products.map((product) => ({
      '품종명': product.name,
      '분류': product.category,
      '재고': product.stock,
      '판매단가': product.unit_price,
      '원가': product.cost_price,
      '안전재고': product.safety_stock,
      '마지막도정일': product.last_milled || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '재고');

  const filename = `재고현황_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
};

// 엑셀에서 판매 데이터 가져오기
export const importSalesFromExcel = async (file: File): Promise<{ success: number; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 첫 번째 시트 읽기
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        const errors: string[] = [];

        // 각 행을 판매 데이터로 변환
        jsonData.forEach((row: any, index: number) => {
          try {
            // 컬럼명 매핑 (다양한 형식 지원)
            const customerName = row['거래처'] || row['거래처명'] || row['고객명'] || row['customer'];
            const productName = row['품종'] || row['품종명'] || row['제품명'] || row['product'];
            const quantity = parseInt(row['수량'] || row['quantity'] || '0');
            const unitPrice = parseFloat(row['단가'] || row['unit_price'] || row['가격'] || '0');
            const status = row['상태'] || row['status'] || '미결제';

            if (!customerName || !productName || !quantity) {
              errors.push(`${index + 2}행: 필수 정보 누락 (거래처, 품종, 수량)`);
              return;
            }

            addSale({
              customer_name: customerName,
              product_name: productName,
              quantity,
              unit_price: unitPrice || 45000, // 기본값
              status,
              notes: row['비고'] || row['notes'] || undefined
            });

            successCount++;
          } catch (error: any) {
            errors.push(`${index + 2}행: ${error.message}`);
          }
        });

        resolve({ success: successCount, errors });
      } catch (error: any) {
        reject(new Error(`엑셀 파일 읽기 실패: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// 통합 내보내기 (모든 데이터를 하나의 엑셀 파일에)
export const exportAllData = async () => {
  const workbook = XLSX.utils.book_new();

  // 1. 판매 내역
  const sales = await getAllSales();
  const salesSheet = XLSX.utils.json_to_sheet(
    (sales as any[]).map((sale) => ({
      '일자': sale.date,
      '거래처': sale.customer_name,
      '품종': sale.product_name,
      '수량': sale.quantity,
      '단가': sale.unit_price,
      '총액': sale.total_amount,
      '상태': sale.status,
      '비고': sale.notes || ''
    }))
  );
  XLSX.utils.book_append_sheet(workbook, salesSheet, '판매내역');

  // 2. 거래처
  const customers = await getAllCustomers();
  const customersSheet = XLSX.utils.json_to_sheet(
    (customers as any[]).map((customer) => ({
      '거래처명': customer.name,
      '연락처': customer.contact || '',
      '주소': customer.address || '',
      '미수금': customer.balance
    }))
  );
  XLSX.utils.book_append_sheet(workbook, customersSheet, '거래처');

  // 3. 재고
  const products = await getAllProducts();
  const inventorySheet = XLSX.utils.json_to_sheet(
    (products as any[]).map((product) => ({
      '품종명': product.name,
      '분류': product.category,
      '재고': product.stock,
      '판매단가': product.unit_price,
      '원가': product.cost_price,
      '안전재고': product.safety_stock
    }))
  );
  XLSX.utils.book_append_sheet(workbook, inventorySheet, '재고');

  const filename = `정미소_전체데이터_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
};
