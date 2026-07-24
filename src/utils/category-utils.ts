// lib/category-utils.ts

const GENRES = [
  "Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Horror", 
  "Documentary", "Romance", "Adventure", "Fantasy", "Animation", "Crime",
  "Science Fiction", "Action & Adventure", "Sci-Fi & Fantasy"
];

export const isGenre = (categoryName: string): boolean => {
  return GENRES.some(g => g.toLowerCase() === categoryName.toLowerCase());
};