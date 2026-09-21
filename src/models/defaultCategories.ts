import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'cat-food', name: 'Food', type: 'EXPENSE', icon: 'MdRestaurant', color: '#ff7043', order: 1, builtIn: true },
  { id: 'cat-travel', name: 'Travel', type: 'EXPENSE', icon: 'MdDirectionsBus', color: '#42a5f5', order: 2, builtIn: true },
  { id: 'cat-shopping', name: 'Shopping', type: 'EXPENSE', icon: 'MdShoppingCart', color: '#ab47bc', order: 3, builtIn: true },
  { id: 'cat-bills', name: 'Bills', type: 'EXPENSE', icon: 'MdReceiptLong', color: '#26a69a', order: 4, builtIn: true },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'EXPENSE', icon: 'MdMovie', color: '#ec407a', order: 5, builtIn: true },
  { id: 'cat-medical', name: 'Medical', type: 'EXPENSE', icon: 'MdLocalHospital', color: '#ef5350', order: 6, builtIn: true },
  { id: 'cat-education', name: 'Education', type: 'EXPENSE', icon: 'MdSchool', color: '#5c6bc0', order: 7, builtIn: true },
  { id: 'cat-rent', name: 'Rent', type: 'EXPENSE', icon: 'MdHome', color: '#8d6e63', order: 8, builtIn: true },
  { id: 'cat-other-exp', name: 'Other', type: 'EXPENSE', icon: 'MdMoreHoriz', color: '#78909c', order: 9, builtIn: true },

  // Income
  { id: 'cat-salary', name: 'Salary', type: 'INCOME', icon: 'MdAttachMoney', color: '#66bb6a', order: 10, builtIn: true },
  { id: 'cat-freelance', name: 'Freelance', type: 'INCOME', icon: 'MdWork', color: '#26c6da', order: 11, builtIn: true },
  { id: 'cat-refund', name: 'Refund', type: 'INCOME', icon: 'MdReplay', color: '#ffa726', order: 12, builtIn: true },
  { id: 'cat-gift', name: 'Gift', type: 'INCOME', icon: 'MdCardGiftcard', color: '#ba68c8', order: 13, builtIn: true },
  { id: 'cat-other-inc', name: 'Other', type: 'INCOME', icon: 'MdMoreHoriz', color: '#78909c', order: 14, builtIn: true }
];
