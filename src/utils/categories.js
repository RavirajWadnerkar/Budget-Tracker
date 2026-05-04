// Default expense categories with icon hints + grouping
export const CATEGORIES = [
  { name: 'Rent', group: 'Housing', color: '#577b5d' },
  { name: 'Utilities', group: 'Housing', color: '#759779' },
  { name: 'Internet', group: 'Housing', color: '#9fb9a0' },
  { name: 'Phone', group: 'Housing', color: '#a8a89a' },
  { name: 'Maintenance', group: 'Housing', color: '#7d7d6e' },

  { name: 'Car + Insurance', group: 'Transport', color: '#e88110' },
  { name: 'EV Charging', group: 'Transport', color: '#f59e2c' },
  { name: 'Tolls', group: 'Transport', color: '#f7b755' },

  { name: 'Groceries', group: 'Daily', color: '#577b5d' },
  { name: 'Toiletries', group: 'Daily', color: '#9fb9a0' },
  { name: 'Dining Out', group: 'Daily', color: '#cd640a' },

  { name: 'Credit Card', group: 'Debt', color: '#bf3f3f' },
  { name: 'Student Loan', group: 'Debt', color: '#d85a5a' },

  { name: 'Emergency Fund', group: 'Savings', color: '#436248' },
  { name: 'Investments', group: 'Savings', color: '#577b5d' },
  { name: 'Travel Fund', group: 'Savings', color: '#759779' },
  { name: 'Big Purchase', group: 'Savings', color: '#9fb9a0' },

  { name: 'Subscriptions', group: 'Lifestyle', color: '#a8480c' },
  { name: 'Gym', group: 'Lifestyle', color: '#cd640a' },
  { name: 'Entertainment', group: 'Lifestyle', color: '#e88110' },
  { name: 'Shopping', group: 'Lifestyle', color: '#f59e2c' },
  { name: 'Hobbies', group: 'Lifestyle', color: '#f7b755' },
  { name: 'Gifts', group: 'Lifestyle', color: '#fad391' },

  { name: 'Medical', group: 'Other', color: '#bf3f3f' },
  { name: 'Misc / Unexpected', group: 'Other', color: '#7d7d6e' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const getCategoryColor = (name) => {
  const cat = CATEGORIES.find((c) => c.name === name);
  return cat?.color || '#7d7d6e';
};

export const getCategoryGroup = (name) => {
  const cat = CATEGORIES.find((c) => c.name === name);
  return cat?.group || 'Other';
};
