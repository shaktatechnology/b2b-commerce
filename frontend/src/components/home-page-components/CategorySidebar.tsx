"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  products_count?: number;
}

interface Props {
  categories: Category[];
  products?: Product[];
}

export default function CategorySidebar({ categories }: Props) {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");

  return (
    <div className="bg-white rounded-xl shadow-md px-4 py-2">
      {/* title with underline */}
      <h2 className="text-xl font-semibold text-primary mb-2 pb-2 border-b-2 border-purple-500 inline-block">
        Category
      </h2>

      {/* list */}
      <div className="space-y-2 mt-2">
        {categories
          ?.filter((cat) => (cat.products_count ?? 0) > 0)
          .slice(0, 8)
          .map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition
                  ${
                    isActive
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <span>{cat.name}</span>

                {/* badge */}
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                  {cat.products_count ?? 0}
                </span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}