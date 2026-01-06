
import React from 'react';

export enum OrderStatus {
  PAID = '결제완료',
  UNPAID = '미결제',
  DELIVERING = '배송중',
  COMPLETED = '거래완료',
  CANCELLED = '취소됨'
}

export interface SaleRecord {
  id: string;
  date: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  millingDate?: string;
}

export interface InventoryItem {
  id: string;
  productName: string;
  stock: number;
  unit: string;
  lastMilled: string;
  safetyStock: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  totalBalance: number;
  lastOrderDate: string;
}

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: 'dashboard' | 'sales' | 'inventory' | 'customers' | 'reports';
}