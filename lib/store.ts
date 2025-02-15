import { create } from 'zustand';

export interface Product {
  code: string;
  name: string;
  quantityPerCase: number;
  totalCases: number;
  totalQuantity: number;
  locations: {
    column: string;
    position: string;
    level: string;
    cases: number;
  }[];
  minimumStock: number;
}

interface ProductStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (code: string, product: Partial<Product>) => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [
    {
      code: "PRD001",
      name: "プレミアムコーヒー豆",
      quantityPerCase: 24,
      totalCases: 50,
      totalQuantity: 1200,
      locations: [
        { column: 'A', position: '1', level: '1', cases: 24 },
        { column: 'B', position: '3', level: '2', cases: 26 }
      ],
      minimumStock: 800,
    },
    {
      code: "PRD002",
      name: "オーガニック紅茶",
      quantityPerCase: 36,
      totalCases: 30,
      totalQuantity: 1080,
      locations: [
        { column: 'A', position: '1', level: '1', cases: 12 },
        { column: 'C', position: '5', level: '3', cases: 18 }
      ],
      minimumStock: 720,
    },
    {
      code: "PRD003",
      name: "抹茶パウダー",
      quantityPerCase: 20,
      totalCases: 25,
      totalQuantity: 500,
      locations: [
        { column: 'A', position: '1', level: '2', cases: 18 },
        { column: 'D', position: '2', level: '1', cases: 7 }
      ],
      minimumStock: 400,
    }
  ],
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({
    products: [...state.products, product]
  })),
  updateProduct: (code, updates) => set((state) => ({
    products: state.products.map((p) =>
      p.code === code ? { ...p, ...updates } : p
    )
  })),
}));