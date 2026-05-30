import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import axiosInstance from "@/lib/axiosinstance";
import { Suspense, useEffect } from "react";

export default function Home() {

  useEffect(() => {
  
    ;(async () => {
      try {
        const response = await axiosInstance.get("/");
        console.log("Trending videos:", response.data);
      } catch (error) {
        console.error("Error fetching trending videos:", error);
      }})();
  }, [])
  

  return (
    <main className="flex-1 p-4">
      <CategoryTabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
