import React from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const VideoCall = dynamic(() => import("../../../components/VideoCall"), { ssr: false });

export default function CallPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || Array.isArray(id)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Call Room</h1>
              <p className="text-sm text-slate-500">Invite friends with this room code or shared link.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <span className="font-semibold">{id}</span>
              <button
                className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(`${window.location.origin}/call/${id}`);
                  }
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        <VideoCall roomId={id} />
      </div>
    </main>
  );
}
