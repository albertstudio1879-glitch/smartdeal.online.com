
export type Category = 
  | 'All'
  | 'Offer Zone'
  | 'Trending'
  | 'Grocery'
  | 'Mobile'
  | 'Fashion'
  | 'For Gen Z'
  | 'Electronics'
  | 'Home & Appliances'
  | 'Kitchen'
  | 'Beauty'
  | 'Furniture'
  | 'Sports'
  | 'Food & Health'
  | 'Auto Acc'
  | 'Toys & Baby'
  | 'Others'
  | 'Home'
  | 'Appliances';

export type Theme = 'light' | 'dark' | 'system';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  highlights?: string[]; // Bullet points
  images: string[];
  affiliateLink: string;
  platform?: string; // e.g. "Amazon", "Flipkart"
  categories: Category[];
  price?: string; 
  mrp?: string; // Maximum Retail Price for strikethrough
  offer?: string; // e.g. "50% OFF"
  likes: number;    // Replaces rating
  dislikes: number; // Replaces rating
  timestamp: number;
}

export interface CategoryDetail {
  id: Category;
  label: string;
}

// Reordered: All first, then Trending
export const CATEGORY_DETAILS: CategoryDetail[] = [
  { id: 'All', label: 'All' },
  { id: 'Trending', label: 'Trending' },
  { id: 'Offer Zone', label: 'Offer Zone' },
  { id: 'Mobile', label: 'Mobile' },
  { id: 'Grocery', label: 'Grocery' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'For Gen Z', label: 'For Gen Z' },
  { id: 'Electronics', label: 'Electronics' },
  { id: 'Home & Appliances', label: 'Home & Appliances' },
  { id: 'Kitchen', label: 'Kitchen' },
  { id: 'Beauty', label: 'Beauty' },
  { id: 'Furniture', label: 'Furniture' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Food & Health', label: 'Food & Health' },
  { id: 'Auto Acc', label: 'Auto Acc' },
  { id: 'Toys & Baby', label: 'Toys & Baby' },
];

// Exclude 'All' from taggable categories used in Admin Panel
export const CATEGORIES: Category[] = CATEGORY_DETAILS
  .map(c => c.id)
  .filter(id => id !== 'All')
  .concat(['Others'] as Category[])
  .filter((v, i, a) => a.indexOf(v) === i) as Category[];
