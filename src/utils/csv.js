import { toDate, formatDate } from './format';

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const exportExpensesToCSV = (expenses, filename = 'expenses.csv') => {
  const headers = [
    'Date',
    'Category',
    'Subcategory',
    'Amount',
    'Notes',
    'Paid By',
    'Created By',
    'Created At',
    'Last Edited By',
    'Last Updated At',
  ];

  const rows = expenses.map((e) => [
    formatDate(toDate(e.date)),
    e.category || '',
    e.subcategory || '',
    Number(e.amount || 0).toFixed(2),
    e.notes || '',
    e.paidByName || '',
    e.createdByName || '',
    e.createdAt ? toDate(e.createdAt).toISOString() : '',
    e.updatedByName || '',
    e.updatedAt ? toDate(e.updatedAt).toISOString() : '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
