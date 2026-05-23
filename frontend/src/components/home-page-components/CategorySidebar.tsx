"use client";

import { useState } from "react";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

interface Props {
  categories: Category[];
}

export default function CategorySidebar({ categories }: Props) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-md px-4 py-2">
      {/* title */}
      <h2 className="text-xl font-semibold text-primary mb-2">Category</h2>

      {/* list */}
      <div className="space-y-2">
        {categories?.slice(0, 8).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition
              ${
                active === cat.id
                  ? "bg-purple-100 text-purple-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <span>{cat.name}</span>

            {/* badge */}
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              0
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
