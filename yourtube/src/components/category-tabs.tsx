import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/AuthContext";

const categories = [
  "All",
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { isLightTheme } = useUser();

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={
            isLightTheme
              ? activeCategory === category
                ? "default"
                : "secondary"
              : "secondary"
          }
          className={`whitespace-nowrap ${
            !isLightTheme
              ? activeCategory === category
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-gray-800 text-white hover:bg-gray-700"
              : ""
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
