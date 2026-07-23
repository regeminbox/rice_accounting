import { SaleRecord, OrderStatus } from '../types';
import { format } from 'date-fns';
import { restoreWebViewFocus } from './focusHelper';

interface PrintOptions {
  title?: string;
  periodLabel?: string; // 예: "2026-07-01 ~ 2026-07-23" 또는 "전체 기간"
}

const escapeHtml = (value: any): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatItems = (row: SaleRecord): string => {
  const anyRow = row as any;
  if (anyRow.isMultiItem && Array.isArray(anyRow.items)) {
    return anyRow.items
      .map(
        (item: any) =>
          `${escapeHtml(item.product_name)} ${item.quantity}개 × ${Number(item.unit_price || 0).toLocaleString()}원`
      )
      .join('<br/>');
  }
  return `${escapeHtml(row.productName)} ${row.quantity}개 × ${Number(row.unitPrice || 0).toLocaleString()}원`;
};

/**
 * 판매 내역을 인쇄용 문서로 만들어 인쇄 대화상자를 연다.
 * 현재 화면에서 필터/정렬된 데이터를 그대로 받아 인쇄한다.
 */
export const printSalesReport = (records: SaleRecord[], options: PrintOptions = {}) => {
  const title = options.title || '판매 내역';
  const periodLabel = options.periodLabel || '전체 기간';
  const printedAt = format(new Date(), 'yyyy-MM-dd HH:mm');

  const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const unpaidAmount = records
    .filter((r) => r.status === OrderStatus.UNPAID)
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const rowsHtml = records
    .map(
      (row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(row.date)}</td>
          <td class="left">${escapeHtml(row.customerName)}</td>
          <td class="left">${formatItems(row)}</td>
          <td class="right">${Number(row.totalAmount || 0).toLocaleString()}원</td>
          <td>${escapeHtml(row.status)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
    color: #1e293b;
    padding: 24px;
    font-size: 12px;
  }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #64748b; margin-bottom: 16px; }
  .summary {
    display: flex;
    gap: 24px;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin-bottom: 16px;
    font-weight: bold;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: center;
    vertical-align: top;
  }
  th { background: #f1f5f9; }
  td.left { text-align: left; }
  td.right { text-align: right; }
  tfoot td { font-weight: bold; background: #f8fafc; }
  @media print {
    body { padding: 0; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">기간: ${escapeHtml(periodLabel)} · 인쇄일시: ${printedAt}</div>
  <div class="summary">
    <span>총 ${records.length}건</span>
    <span>합계 금액: ${totalAmount.toLocaleString()}원</span>
    <span>미결제 금액: ${unpaidAmount.toLocaleString()}원</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 44px;">번호</th>
        <th style="width: 90px;">일자</th>
        <th style="width: 130px;">거래처</th>
        <th>품목 내역</th>
        <th style="width: 110px;">합계 금액</th>
        <th style="width: 80px;">상태</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="right">합계 (${records.length}건)</td>
        <td class="right">${totalAmount.toLocaleString()}원</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  // 숨겨진 iframe에 문서를 만들어 인쇄 (현재 화면은 그대로 유지)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    document.body.removeChild(iframe);
    alert('인쇄 문서를 생성하지 못했습니다.');
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  // 문서 렌더링이 끝난 뒤 인쇄 대화상자 열기
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // 인쇄 대화상자가 닫힌 뒤 정리 + 웹뷰 포커스 복원
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      restoreWebViewFocus();
    }, 1000);
  }, 200);
};
