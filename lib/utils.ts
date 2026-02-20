import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateProductUrl(name: string, id: string) {
  const slug = slugify(name);
  return slug ? `/product/${slug}-${id}` : `/product/${id}`;
}

export function extractProductId(slugOrId: string) {
  const parts = slugOrId.split('-');
  return parts[parts.length - 1];
}
