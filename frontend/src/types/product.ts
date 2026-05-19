import { Category } from './category';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  category_id: number;
  category?: Category;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image?: File | null;
}
