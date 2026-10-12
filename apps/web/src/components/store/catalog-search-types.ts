export type CatalogSearchProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  category: string;
  createdAt: number;
  image: string;
  colors?: string[];
};
