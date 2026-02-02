import { initDatabase } from './database';

// NaN 데이터를 찾아서 수정하는 함수
export const fixNaNSales = async () => {
  const database = await initDatabase();

  return new Promise(async (resolve, reject) => {
    try {
      const transaction = database.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = async () => {
        const sales = getAllRequest.result;
        let fixedCount = 0;
        let deletedCount = 0;

        for (const sale of sales) {
          // total_amount가 NaN이거나 없는 경우
          if (isNaN(sale.total_amount) || sale.total_amount === undefined || sale.total_amount === null) {

            // 다품종인 경우
            if (sale.is_multi_item && sale.items && sale.items.length > 0) {
              const recalculated = sale.items.reduce((sum: number, item: any) => {
                const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
                return sum + (isNaN(itemTotal) ? 0 : itemTotal);
              }, 0);

              if (recalculated > 0) {
                sale.total_amount = recalculated;
                const updateTx = database.transaction(['sales'], 'readwrite');
                const updateStore = updateTx.objectStore('sales');
                updateStore.put(sale);
                fixedCount++;
                console.log(`수정됨 (다품종): ${sale.id} - ${recalculated}원`);
              } else {
                // 복구 불가능한 경우 삭제
                const deleteTx = database.transaction(['sales'], 'readwrite');
                const deleteStore = deleteTx.objectStore('sales');
                deleteStore.delete(sale.id);
                deletedCount++;
                console.log(`삭제됨: ${sale.id} - 복구 불가`);
              }
            }
            // 단일 품목인 경우
            else if (sale.quantity && sale.unit_price) {
              const recalculated = sale.quantity * sale.unit_price;

              if (!isNaN(recalculated) && recalculated > 0) {
                sale.total_amount = recalculated;
                const updateTx = database.transaction(['sales'], 'readwrite');
                const updateStore = updateTx.objectStore('sales');
                updateStore.put(sale);
                fixedCount++;
                console.log(`수정됨 (단일): ${sale.id} - ${recalculated}원`);
              } else {
                // 복구 불가능한 경우 삭제
                const deleteTx = database.transaction(['sales'], 'readwrite');
                const deleteStore = deleteTx.objectStore('sales');
                deleteStore.delete(sale.id);
                deletedCount++;
                console.log(`삭제됨: ${sale.id} - 복구 불가`);
              }
            }
            // 데이터가 완전히 손상된 경우
            else {
              const deleteTx = database.transaction(['sales'], 'readwrite');
              const deleteStore = deleteTx.objectStore('sales');
              deleteStore.delete(sale.id);
              deletedCount++;
              console.log(`삭제됨: ${sale.id} - 데이터 손상`);
            }
          }
        }

        resolve({
          success: true,
          fixedCount,
          deletedCount,
          message: `수정: ${fixedCount}건, 삭제: ${deletedCount}건`
        });
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    } catch (error) {
      reject(error);
    }
  });
};
