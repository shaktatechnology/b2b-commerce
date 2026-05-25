import Link from 'next/link';
import type { StorefrontCategory } from '@/src/types/storefront';

interface ProductBreadcrumbProps {
  category?: StorefrontCategory;
  productName: string;
}

export default function ProductBreadcrumb({
  category,
  productName,
}: ProductBreadcrumbProps) {
  return (
    <nav className="text-xs sm:text-sm text-gray-500 mb-4 flex flex-wrap items-center gap-1">
      <Link href="/" className="hover:text-primary transition-colors">
        Home
      </Link>
      {category && (
        <>
          <span className="text-gray-400">&gt;</span>
          <Link
            href={`/products?category=${category.slug}`}
            className="hover:text-primary transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}
      <span className="text-gray-400">&gt;</span>
      <span className="text-primary font-medium line-clamp-1">{productName}</span>
    </nav>
  );
}
