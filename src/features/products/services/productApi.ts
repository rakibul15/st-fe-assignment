import type { Product, PaginatedResponse, FetchProductsParams } from '../types/product';

// Static mock data
const mockProducts: Product[] = Array.from({ length: 154 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: `Premium Product ${i + 1}`,
  description: `This is a detailed description for Premium Product ${i + 1}. It features exceptional quality and design, perfect for modern needs.`,
  price: Math.floor(Math.random() * 500) + 50,
  category: ['Electronics', 'Clothing', 'Home', 'Outdoors'][Math.floor(Math.random() * 4)],
  imageUrl: `https://picsum.photos/seed/${i + 1}/400/300`,
  stock: Math.floor(Math.random() * 50),
}));

export const api = {
  /**
   * Fetches products with pagination and optional filtering.
   * WARNING: This API is intentionally flaky and slow!
   */
  fetchProducts: async (params: FetchProductsParams = {}): Promise<PaginatedResponse<Product>> => {
    const { page = 1, limit = 12, category, search } = params;

    // 1. Simulate network delay (500ms - 2500ms)
    const delay = Math.floor(Math.random() * 2000) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 2. Simulate probabilistic failure (20% chance)
    if (Math.random() < 0.2) {
      throw new Error('Network Error: Failed to fetch products. The server might be overloaded.');
    }

    // 3. Process data
    let filteredData = mockProducts;

    if (category) {
      filteredData = filteredData.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        p => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    };
  },
};
