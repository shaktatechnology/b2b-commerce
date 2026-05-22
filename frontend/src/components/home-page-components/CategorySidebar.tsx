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
    <div className="bg-white rounded-xl shadow-md p-4">
      {/* TITLE */}
      <h2 className="text-lg font-semibold text-purple-600 mb-4">
        Category
      </h2>

      {/* LIST */}
      <div className="space-y-2">
        {categories?.map((cat) => (
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

            {/* badge (optional) */}
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              0
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}