import React from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const VideoCall = dynamic(() => import("../../../components/VideoCall"), { ssr: false });

export default function CallPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isLightTheme } = useUser();

  if (!id || Array.isArray(id)) {
    return (
      <main
        className={`min-h-screen flex items-center justify-center p-6 ${
          isLightTheme
            ? "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)]"
            : "bg-gradient-to-b from-slate-950 via-slate-900 to-black"
        }`}
      >
        <div
          className={`rounded-xl border p-8 shadow-sm ${
            isLightTheme
              ? "border-slate-200 bg-white text-slate-950"
              : "border-slate-800 bg-slate-950 text-white"
          }`}
        >
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen p-6 ${
        isLightTheme
          ? "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)]"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-black"
      }`}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            isLightTheme
              ? "border-slate-200 bg-white text-slate-950"
              : "border-slate-800 bg-slate-950 text-white"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Call Room</h1>
              <p className={`${isLightTheme ? "text-slate-600" : "text-slate-300"} text-sm`}>
                Invite friends with this room code or shared link.
              </p>
            </div>
            <div
              className={`inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-2 text-sm ${
                isLightTheme
                  ? "border border-slate-200 bg-slate-50 text-slate-700"
                  : "border border-slate-700 bg-slate-900 text-slate-200"
              }`}
            >
              <span className="font-semibold">{id}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(`${window.location.origin}/call/${id}`);
                  }
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        <VideoCall roomId={id} />
      </div>
    </main>
  );
}
