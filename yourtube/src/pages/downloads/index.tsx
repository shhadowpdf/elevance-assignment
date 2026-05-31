import Link from "next/link";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { getVideoSrc } from "@/lib/utils";
import { toast } from "sonner";

const DownloadsPage = () => {
  const { user, login } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [downloadCountToday, setDownloadCountToday] = useState(0);
  const [lastDownloadDate, setLastDownloadDate] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchDownloads();
  }, [user]);

  const fetchDownloads = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/user/downloads/${user._id}`);
      setDownloads(res.data.downloads || []);
      setIsPremium(res.data.isPremium);
      setDownloadCountToday(res.data.downloadCountToday || 0);
      setLastDownloadDate(
        res.data.lastDownloadDate
          ? new Date(res.data.lastDownloadDate).toLocaleDateString()
          : null,
      );
    } catch (fetchError: any) {
      setError(
        fetchError?.response?.data?.message || "Unable to fetch downloads.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve, reject) => {
      if (typeof window === "undefined") {
        return reject(false);
      }

      if ((window as any).Razorpay) {
        return resolve(true);
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(false);
      document.body.appendChild(script);
    });

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Please sign in to upgrade to premium.");
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      await loadRazorpayScript();

      const orderResponse = await axiosInstance.post("/user/payment/order", {
        amount: 10000,
        currency: "INR",
        receipt: `premium_${Date.now()}`,
      });

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const razorpayOptions = {
        key: razorpayKey,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "YourTube Premium",
        description: "Unlimited video downloads",
        order_id: orderResponse.data.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#f97316",
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await axiosInstance.post(
              "/user/payment/verify",
              {
                userId: user._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            );
            setIsPremium(verifyResponse.data.user.isPremium);
            login(verifyResponse.data.user);
            fetchDownloads();
            toast.success(
              "Premium upgraded successfully! You can now download unlimited videos.",
            );
          } catch (verifyError: any) {
            toast.error(
              verifyError?.response?.data?.message ||
                "Payment verification failed.",
            );
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(razorpayOptions);
      rzp.open();
    } catch (payError) {
      setError("Unable to initiate payment. Please try again later.");
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading downloads...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="mt-2 text-sm text-gray-600">
              Downloaded videos are stored here for quick access. Free users may
              download one video per day.
            </p>
          </div>
          <div className="space-y-3 text-right">
            {user ? (
              <>
                <div className="text-sm text-gray-700">
                  Plan:{" "}
                  <span className="font-semibold">
                    {isPremium ? "Premium" : "Free"}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  Today&apos;s downloads:{" "}
                  <span className="font-semibold">{downloadCountToday}</span>
                </div>
                {lastDownloadDate && (
                  <div className="text-sm text-gray-700">
                    Last used: {lastDownloadDate}
                  </div>
                )}
                {!isPremium && (
                  <Button disabled={paymentLoading} onClick={handleUpgrade}>
                    {paymentLoading ? "Processing..." : "Upgrade to Premium"}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-700">
                Sign in to see your downloads and upgrade to premium.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

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
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-lg font-medium">No downloads yet.</p>
                <p className="mt-2 text-sm text-gray-600">
                  Watch a video and click the Download button to save it here.
                  Upgrade to premium to download unlimited videos.
                </p>
              </div>
            ) : (
              downloads.map((item: any) => (
                <div
                  key={`${item.videoid?._id || item.title}-${item.downloadedAt}`}
                  className="rounded-lg border border-gray-200 p-5 shadow-sm"
                >
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    
                    <div>
                      <Link href={`/watch/${item.videoid?._id || ""}`}>
                        <h2 className="text-xl font-semibold text-slate-900 hover:text-slate-700">
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
                      <a href={item.url} download className="inline-block">
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
