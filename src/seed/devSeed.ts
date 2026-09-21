import { Transaction } from '../models/types';

/**
 * Dev-only seed data reproducing exact numbers from reference screenshots.
 * ONLY loaded when import.meta.env.DEV is true AND dev seed flag is explicitly invoked.
 * Must NEVER be in release builds.
 */
export function getDevSeedTransactions(): Transaction[] {
  const tx: Transaction[] = [];

  // Mar 2026: 100 income, 0 expense
  tx.push({
    id: 'seed-mar-1',
    type: 'INCOME',
    title: 'March Income',
    amountMinor: 10000,
    description: '',
    categoryId: 'cat-other-inc',
    date: '2026-03-15',
    time: '12:00',
    createdAt: 1773554400000,
    updatedAt: 1773554400000,
    imageId: null,
    deletedAt: null
  });

  // Apr 2026: 56,500 income, 28,575 expense
  tx.push({
    id: 'seed-apr-inc',
    type: 'INCOME',
    title: 'April Income',
    amountMinor: 5650000,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-04-05',
    time: '10:00',
    createdAt: 1775368800000,
    updatedAt: 1775368800000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-apr-exp',
    type: 'EXPENSE',
    title: 'April Expenses',
    amountMinor: 2857500,
    description: '',
    categoryId: 'cat-bills',
    date: '2026-04-20',
    time: '15:30',
    createdAt: 1776664800000,
    updatedAt: 1776664800000,
    imageId: null,
    deletedAt: null
  });

  // May 2026: 73,100 income, 66,965 expense
  tx.push({
    id: 'seed-may-inc',
    type: 'INCOME',
    title: 'May Income',
    amountMinor: 7310000,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-05-05',
    time: '10:00',
    createdAt: 1777960800000,
    updatedAt: 1777960800000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-may-exp',
    type: 'EXPENSE',
    title: 'May Expenses',
    amountMinor: 6696500,
    description: '',
    categoryId: 'cat-bills',
    date: '2026-05-22',
    time: '16:00',
    createdAt: 1779429600000,
    updatedAt: 1779429600000,
    imageId: null,
    deletedAt: null
  });

  // Jun 2026: 1,16,085 income, 1,21,078 expense
  tx.push({
    id: 'seed-jun-inc',
    type: 'INCOME',
    title: 'June Income',
    amountMinor: 11608500,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-06-05',
    time: '10:00',
    createdAt: 1780642800000,
    updatedAt: 1780642800000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-jun-exp',
    type: 'EXPENSE',
    title: 'June Expenses',
    amountMinor: 12107800,
    description: '',
    categoryId: 'cat-bills',
    date: '2026-06-25',
    time: '17:00',
    createdAt: 1782370800000,
    updatedAt: 1782370800000,
    imageId: null,
    deletedAt: null
  });

  // Jul 2026: 91,000 income, 1,13,009 expense
  tx.push({
    id: 'seed-jul-inc',
    type: 'INCOME',
    title: 'July Income',
    amountMinor: 9100000,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-07-05',
    time: '10:00',
    createdAt: 1783234800000,
    updatedAt: 1783234800000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-jul-exp',
    type: 'EXPENSE',
    title: 'July Expenses',
    amountMinor: 11300900,
    description: '',
    categoryId: 'cat-bills',
    date: '2026-07-28',
    time: '18:00',
    createdAt: 1785222000000,
    updatedAt: 1785222000000,
    imageId: null,
    deletedAt: null
  });

  // Aug 2026: 56,000 income, 57,715 expense
  tx.push({
    id: 'seed-aug-inc',
    type: 'INCOME',
    title: 'August Income',
    amountMinor: 5600000,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-08-05',
    time: '10:00',
    createdAt: 1785913200000,
    updatedAt: 1785913200000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-aug-exp',
    type: 'EXPENSE',
    title: 'August Expenses',
    amountMinor: 5771500,
    description: '',
    categoryId: 'cat-bills',
    date: '2026-08-28',
    time: '18:00',
    createdAt: 1787900400000,
    updatedAt: 1787900400000,
    imageId: null,
    deletedAt: null
  });

  // Net carried into September 2026 = 5,443.00 (544300 paise)
  // September 2026 target:
  // Income: 34,900.00 (3490000 paise)
  // Expense: 37,627.00 (3762700 paise)
  // Chart shape:
  // 01 Sep: Income ~3,000, Expense ~7,000
  // 04 Sep: Income ~5,000
  // 05 Sep: Income ~1,500, Expense ~3,000
  tx.push({
    id: 'seed-sep-01-inc',
    type: 'INCOME',
    title: 'Freelance payment',
    amountMinor: 300000,
    description: '',
    categoryId: 'cat-freelance',
    date: '2026-09-01',
    time: '11:00',
    createdAt: 1788242400000,
    updatedAt: 1788242400000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-sep-01-exp',
    type: 'EXPENSE',
    title: 'Rent & Maintenance',
    amountMinor: 700000,
    description: '',
    categoryId: null, // uncategorized (1)
    date: '2026-09-01',
    time: '14:00',
    createdAt: 1788253200000,
    updatedAt: 1788253200000,
    imageId: null,
    deletedAt: null
  });

  tx.push({
    id: 'seed-sep-04-inc',
    type: 'INCOME',
    title: 'Consulting client',
    amountMinor: 500000,
    description: '',
    categoryId: 'cat-freelance',
    date: '2026-09-04',
    time: '12:00',
    createdAt: 1788501600000,
    updatedAt: 1788501600000,
    imageId: null,
    deletedAt: null
  });

  tx.push({
    id: 'seed-sep-05-inc',
    type: 'INCOME',
    title: 'Cash refund',
    amountMinor: 150000,
    description: '',
    categoryId: 'cat-refund',
    date: '2026-09-05',
    time: '10:00',
    createdAt: 1788588000000,
    updatedAt: 1788588000000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-sep-05-exp',
    type: 'EXPENSE',
    title: 'Groceries store',
    amountMinor: 300000,
    description: '',
    categoryId: null, // uncategorized (2)
    date: '2026-09-05',
    time: '16:00',
    createdAt: 1788609600000,
    updatedAt: 1788609600000,
    imageId: null,
    deletedAt: null
  });

  // Remaining income for Sep: 34,900 - 3,000 - 5,000 - 1,500 = 25,400
  tx.push({
    id: 'seed-sep-10-inc',
    type: 'INCOME',
    title: 'Salary Credit',
    amountMinor: 2540000,
    description: '',
    categoryId: 'cat-salary',
    date: '2026-09-10',
    time: '09:00',
    createdAt: 1789020000000,
    updatedAt: 1789020000000,
    imageId: null,
    deletedAt: null
  });

  // Specific screenshot entries:
  // Thu, 17 Sep: Sadik Bhaiya Ko Dalo Bole ...
  tx.push({
    id: 'seed-sep-17-exp',
    type: 'EXPENSE',
    title: 'Sadik Bhaiya Ko Dalo Bole',
    amountMinor: 50000,
    description: '',
    categoryId: null, // uncategorized (3)
    date: '2026-09-17',
    time: '13:00',
    createdAt: 1789624800000,
    updatedAt: 1789624800000,
    imageId: null,
    deletedAt: null
  });

  // Sat, 19 Sep: Sadik Bhaiya Scanner Dale the 310
  tx.push({
    id: 'seed-sep-19-exp',
    type: 'EXPENSE',
    title: 'Sadik Bhaiya Scanner Dale the',
    amountMinor: 31000,
    description: '',
    categoryId: null, // uncategorized (4)
    date: '2026-09-19',
    time: '18:15',
    createdAt: 1789816500000,
    updatedAt: 1789816500000,
    imageId: null,
    deletedAt: null
  });

  // Sun, 20 Sep: Altaf Number Deye The 200, Anil Kalal 1,000
  tx.push({
    id: 'seed-sep-20-exp1',
    type: 'EXPENSE',
    title: 'Altaf Number Deye The',
    amountMinor: 20000,
    description: '',
    categoryId: null, // uncategorized (5)
    date: '2026-09-20',
    time: '11:20',
    createdAt: 1789878000000,
    updatedAt: 1789878000000,
    imageId: null,
    deletedAt: null
  });
  tx.push({
    id: 'seed-sep-20-exp2',
    type: 'EXPENSE',
    title: 'Anil Kalal',
    amountMinor: 100000,
    description: '',
    categoryId: null, // uncategorized (6)
    date: '2026-09-20',
    time: '15:45',
    createdAt: 1789893900000,
    updatedAt: 1789893900000,
    imageId: null,
    deletedAt: null
  });

  // Exactly 23 uncategorized items + 1 remainder item = 24 items + 6 previous = 30 uncategorized items total!
  const remainingCount = 23;
  const itemAmt = 100000; // 1,000.00
  let allocated = 0;

  for (let i = 1; i <= remainingCount; i++) {
    const day = (i % 15) + 2; // Days 2 to 16
    const dayStr = day.toString().padStart(2, '0');
    tx.push({
      id: `seed-sep-uncat-${i}`,
      type: 'EXPENSE',
      title: `General Purchase ${i}`,
      amountMinor: itemAmt,
      description: '',
      categoryId: null, // uncategorized
      date: `2026-09-${dayStr}`,
      time: '14:00',
      createdAt: 1788300000000 + i * 3600000,
      updatedAt: 1788300000000 + i * 3600000,
      imageId: null,
      deletedAt: null
    });
    allocated += itemAmt;
  }

  // Final 30th uncategorized item with exact remainder
  // Total target expense: 37,627.00 = 3762700 paise
  // Six items: 700,000 + 300,000 + 50,000 + 31,000 + 20,000 + 100,000 = 1,201,000
  // Allocated: 23 * 100,000 = 2,300,000
  // Sum so far: 3,501,000
  // Remainder: 3,762,700 - 3,501,000 = 261,700 (₹2,617.00)
  const remainderPaise = 3762700 - (1201000 + allocated);
  tx.push({
    id: 'seed-sep-uncat-30',
    type: 'EXPENSE',
    title: 'Monthly utility bill',
    amountMinor: remainderPaise,
    description: '',
    categoryId: null, // uncategorized (30)
    date: '2026-09-08',
    time: '17:00',
    createdAt: 1788850000000,
    updatedAt: 1788850000000,
    imageId: null,
    deletedAt: null
  });

  return tx;
}
