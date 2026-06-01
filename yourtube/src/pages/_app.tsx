import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <div className="min-h-screen bg-white text-black">
        <title>Your-Tube Clone</title>
        <Header
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSidebarClose={() => setIsSidebarOpen(false)}
        />
        <Toaster />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="flex relative">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          {isSidebarOpen && (
            <div className="fixed inset-y-0 left-0 z-40 md:hidden">
              <Sidebar mobile={true} onClose={() => setIsSidebarOpen(false)} />
            </div>
          )}
          <main className="flex-1 w-full overflow-x-auto">
            <div className="max-w-7xl mx-auto p-2 sm:p-4">
              <Component {...pageProps} />
            </div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
