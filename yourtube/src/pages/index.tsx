import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import axiosInstance from "@/lib/axiosinstance";
import { Suspense, useEffect } from "react";

export default function Home() {

  useEffect(()=> {
    ;(async()=>{
      const res = await axiosInstance.get('/');
      console.log(res);
      
    })();
  },[])
  return (
    <main className="flex-1 p-4">
      <CategoryTabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
