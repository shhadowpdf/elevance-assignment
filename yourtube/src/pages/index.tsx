import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Suspense, useEffect } from "react";

export default function Home() {
  const {isLightTheme} = useUser()
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
    <main className={`flex-1 p-4 ${isLightTheme ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`}>
      <CategoryTabs />
      <Suspense fallback={<div className = {isLightTheme ? "bg-white text-gray-900" : "bg-gray-900 text-white"}>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
