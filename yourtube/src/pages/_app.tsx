// pages/_app.tsx

import { useState } from "react";
import type { AppProps } from "next/app";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

import { UserProvider, useUser } from "../lib/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <AppLayout Component={Component} pageProps={pageProps} />
    </UserProvider>
  );
}

type AppLayoutProps = {
  Component: AppProps["Component"];
  pageProps: AppProps["pageProps"];
};

function AppLayout({ Component, pageProps }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { isLightTheme } = useUser();

  return (
    <div
      className={`min-h-screen ${
        isLightTheme
          ? "bg-white text-gray-900"
          : "bg-gray-900 text-white"
      }`}
    >
      <title>Your-Tube Clone</title>

      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSidebarClose={() => setIsSidebarOpen(false)}
      />

      <Toaster />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="relative flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-40 md:hidden">
            <Sidebar
              mobile={true}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        <main className="flex-1 w-full overflow-x-auto">
          <div className="mx-auto max-w-7xl p-2 sm:p-4">
            <Component {...pageProps} />
          </div>
        </main>
      </div>
    </div>
  );
}