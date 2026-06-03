import Link from "next/link";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import { getVideoSrc } from "@/lib/utils";
import { useUser } from "@/lib/AuthContext";
import {
  formatPrice,
  formatWatchLimit,
  getEffectivePlanCode,
  getPlanConfig,
} from "@/lib/plans";
import { toast } from "sonner";

const DownloadsPage = () => {
  const { user, isLightTheme } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [planCode, setPlanCode] = useState(getEffectivePlanCode(user));
  const [planName, setPlanName] = useState(getPlanConfig(planCode).name);
  const [watchLimitMinutes, setWatchLimitMinutes] = useState<number | null>(
    getPlanConfig(planCode).watchLimitMinutes,
  );
  const [downloadCountToday, setDownloadCountToday] = useState(0);
  const [lastDownloadDate, setLastDownloadDate] = useState<string | null>(null);

  useEffect(() => {
    const effectivePlanCode = getEffectivePlanCode(user);
    const effectivePlan = getPlanConfig(effectivePlanCode);

    setPlanCode(effectivePlanCode);
    setPlanName(user?.planName || effectivePlan.name);
    setWatchLimitMinutes(
      typeof user?.watchLimitMinutes === "number" ||
        user?.watchLimitMinutes === null
        ? user.watchLimitMinutes
        : effectivePlan.watchLimitMinutes,
    );
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDownloads([]);
      setLoading(false);
      return;
    }

    const fetchDownloads = async () => {
      setLoading(true);

      try {
        const res = await axiosInstance.get(`/user/downloads/${user._id}`);
        const responsePlanCode = res.data.planCode || "free";
        const responsePlan = getPlanConfig(responsePlanCode);

        setDownloads(res.data.downloads || []);
        setPlanCode(responsePlanCode);
        setPlanName(res.data.planName || responsePlan.name);
        setWatchLimitMinutes(
          typeof res.data.watchLimitMinutes === "number" ||
            res.data.watchLimitMinutes === null
            ? res.data.watchLimitMinutes
            : responsePlan.watchLimitMinutes,
        );
        setDownloadCountToday(res.data.downloadCountToday || 0);
        setLastDownloadDate(
          res.data.lastDownloadDate
            ? new Date(res.data.lastDownloadDate).toLocaleDateString()
            : null,
        );
      } catch (fetchError: any) {
        toast.error(
          fetchError?.response?.data?.message || "Unable to fetch downloads.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user]);

  const currentPlan = getPlanConfig(planCode);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading downloads...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isLightTheme ? "bg-white" : "bg-gray-900"} px-4 py-8`}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section
          className={`overflow-hidden rounded-[28px] p-6 shadow-[0_18px_45px_rgba(194,65,12,0.08)] ${
            isLightTheme
              ? "border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#fffaf2_100%)]"
              : "border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-black"
          }`}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h1
                className={`text-3xl font-semibold tracking-tight ${
                  isLightTheme ? "text-slate-950" : "text-white"
                }`}
              >
                Downloads
              </h1>

              <p
                className={`mt-3 text-sm leading-6 ${
                  isLightTheme ? "text-slate-600" : "text-gray-400"
                }`}
              >
                Keep your saved videos close at hand. Every paid plan includes
                unlimited downloads, while Free stays limited to one download
                per day.
              </p>
            </div>

            <div
              className={`w-full max-w-sm rounded-[24px] p-5 shadow-sm ${
                isLightTheme
                  ? "border border-slate-200 bg-white"
                  : "border border-gray-800 bg-gray-900"
              }`}
            >
              <div
                className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                  isLightTheme ? "text-slate-500" : "text-gray-400"
                }`}
              >
                Current access
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-4">
                <div>
                  <div
                    className={`text-2xl font-semibold ${
                      isLightTheme ? "text-slate-950" : "text-white"
                    }`}
                  >
                    {planName}
                  </div>

                  <p
                    className={`mt-1 text-sm ${
                      isLightTheme ? "text-slate-600" : "text-gray-400"
                    }`}
                  >
                    Watch limit: {formatWatchLimit(watchLimitMinutes)}
                  </p>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isLightTheme
                      ? "bg-slate-950 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {formatPrice(currentPlan.pricePaise)}
                </div>
              </div>

              <div
                className={`mt-4 space-y-2 text-sm ${
                  isLightTheme ? "text-slate-600" : "text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Downloads today</span>
                  <span
                    className={`font-medium ${
                      isLightTheme ? "text-slate-950" : "text-white"
                    }`}
                  >
                    {downloadCountToday}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Download access</span>
                  <span
                    className={`font-medium ${
                      isLightTheme ? "text-slate-950" : "text-white"
                    }`}
                  >
                    {currentPlan.rank > 0 ? "Unlimited" : "1 per day"}
                  </span>
                </div>

                {lastDownloadDate && (
                  <div className="flex items-center justify-between">
                    <span>Last used</span>
                    <span
                      className={`font-medium ${
                        isLightTheme ? "text-slate-950" : "text-white"
                      }`}
                    >
                      {lastDownloadDate}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <Button
                  asChild
                  className={`w-full rounded-full ${
                    isLightTheme
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                >
                  <Link href="/subscriptions">
                    {currentPlan.code === "gold"
                      ? "View plans"
                      : "Upgrade plan"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div
          className={`text-sm ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}
        >
          {user
            ? `Signed in as ${user.email}`
            : "Sign in to see your downloads and compare plans."}
        </div>

        {!user ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="mb-4 text-lg font-medium">
              Sign in to access your downloads.
            </p>
            <Link href="/">
              <Button>Back to home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {downloads.length === 0 ? (
              <div
                className={`rounded-lg border ${isLightTheme ? "border-gray-200 bg-gray-50" : "border-gray-600 bg-gray-800"} p-6 text-center`}
              >
                <p className="text-lg font-medium">No downloads yet.</p>
                <p
                  className={`mt-2 text-sm ${isLightTheme ? "text-gray-600" : "text-white"}`}
                >
                  Watch a video and click the Download button to save it here.
                  Upgrade your plan to remove the daily download limit.
                </p>
              </div>
            ) : (
              downloads.map((item: any) => (
                <div
                  key={`${item.videoid?._id || item.title}-${item.downloadedAt}`}
                  className="rounded-lg border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Link href={`/watch/${item.videoid?._id || ""}`}>
                        <h2
                          className={`text-xl font-semibold ${isLightTheme ? "text-slate-900 hover:text-slate-700" : "text-white hover:text-gray-300"}`}
                        >
                          {item.title || item.videoid?.videotitle}
                        </h2>
                      </Link>
                      <p className="mt-1 text-sm text-gray-600">
                        Downloaded on{" "}
                        {new Date(item.downloadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/watch/${item.videoid?._id || ""}`}>
                        <Button variant="secondary">Open video</Button>
                      </Link>
                      <a
                        href={getVideoSrc(item.url)}
                        download
                        className="inline-block"
                      >
                        <Button variant="secondary">Download again</Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
