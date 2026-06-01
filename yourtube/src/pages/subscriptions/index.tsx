import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import {
  calculateUpgradeChargePaise,
  formatPrice,
  formatWatchLimit,
  getEffectivePlanCode,
  getPlanConfig,
  PLAN_ORDER,
  type PlanCode,
} from "@/lib/plans";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(false);
    document.body.appendChild(script);
  });

const SubscriptionsPage = () => {
  const router = useRouter();
  const { user, login, handlegooglesignin } = useUser();
  const [paymentLoading, setPaymentLoading] = useState<PlanCode | null>(null);

  const currentPlanCode = getEffectivePlanCode(user);
  const currentPlan = getPlanConfig(currentPlanCode);

  const planCards = useMemo(
    () =>
      PLAN_ORDER.map((planCode) => {
        const plan = getPlanConfig(planCode);
        const chargePaise = calculateUpgradeChargePaise(
          currentPlanCode,
          plan.code
        );

        return {
          ...plan,
          chargePaise,
          isCurrent: plan.code === currentPlanCode,
          isLocked: chargePaise === null,
        };
      }),
    [currentPlanCode]
  );

  const handleUpgrade = async (targetPlanCode: PlanCode) => {
    if (!user?._id) {
      toast.error("Sign in to upgrade your plan.");
      await handlegooglesignin();
      return;
    }

    try {
      setPaymentLoading(targetPlanCode);
      await loadRazorpayScript();

      const orderResponse = await axiosInstance.post("/user/payment/order", {
        userId: user._id,
        targetPlanCode,
      });

      const targetPlan = getPlanConfig(targetPlanCode);
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        toast.error("Razorpay is not configured for the frontend.");
        setPaymentLoading(null);
        return;
      }

      const razorpayOptions = {
        key: razorpayKey,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: `YourTube ${targetPlan.name}`,
        description: `${targetPlan.name} lifetime plan upgrade`,
        order_id: orderResponse.data.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#c2410c",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await axiosInstance.post(
              "/user/payment/verify",
              {
                userId: user._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            login(verifyResponse.data.user);
            setPaymentLoading(null);

            if (verifyResponse.data.emailSent) {
              toast.success(
                `${targetPlan.name} activated. Your invoice email has been sent.`
              );
            } else {
              toast.success(
                `${targetPlan.name} activated. We could not send the invoice email right now.`
              );
            }

            router.replace(router.asPath);
          } catch (verifyError: any) {
            setPaymentLoading(null);
            toast.error(
              verifyError?.response?.data?.message ||
                "Payment verification failed."
            );
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(null),
        },
      };

      const RazorpayCtor = window.Razorpay;

      if (!RazorpayCtor) {
        throw new Error("Unable to initialize Razorpay.");
      }

      const razorpay = new RazorpayCtor(razorpayOptions);
      razorpay.open();
    } catch (error: any) {
      setPaymentLoading(null);
      toast.error(
        error?.response?.data?.message ||
          "Unable to initiate your upgrade right now."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-orange-200 bg-white shadow-[0_24px_80px_rgba(154,52,18,0.08)]">
          <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-10">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                Plans & Access
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
                  Upgrade your watch time without losing the simplicity of the free tier.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  Every paid plan is a lifetime unlock, includes unlimited downloads,
                  and moves you up the ladder only when you want more room to watch.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
              <div className="text-sm uppercase tracking-[0.28em] text-orange-200">
                Current plan
              </div>
              <div className="mt-5 text-3xl font-semibold">{currentPlan.name}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Watch limit: {formatWatchLimit(currentPlan.watchLimitMinutes)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Downloads: {currentPlan.rank > 0 ? "Unlimited" : "1 per day"}
              </p>
              {!user && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                  Sign in to purchase a plan and keep the upgrade attached to your account.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          {planCards.map((plan) => (
            <article
              key={plan.code}
              className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${
                plan.isCurrent ? "ring-2 ring-orange-400" : ""
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${plan.accent} opacity-90`}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {plan.name}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">
                      {plan.pricePaise === 0 ? "Free" : formatPrice(plan.pricePaise)}
                    </div>
                  </div>
                  {plan.isCurrent && (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                      Current
                    </span>
                  )}
                </div>

                <p className="relative mt-6 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>

                <div className="relative mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white/85 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Watch time</span>
                    <span className="font-medium text-slate-950">
                      {formatWatchLimit(plan.watchLimitMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Downloads</span>
                    <span className="font-medium text-slate-950">
                      {plan.rank > 0 ? "Unlimited" : "1/day"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Billing</span>
                    <span className="font-medium text-slate-950">Lifetime</span>
                  </div>
                </div>

                <div className="relative mt-6 flex-1" />

                {plan.code === "free" ? (
                  <Button
                    variant="outline"
                    disabled
                    className="relative mt-6 rounded-full"
                  >
                    Included
                  </Button>
                ) : plan.isCurrent ? (
                  <Button disabled className="relative mt-6 rounded-full">
                    Active plan
                  </Button>
                ) : plan.chargePaise === null ? (
                  <Button
                    variant="outline"
                    disabled
                    className="relative mt-6 rounded-full"
                  >
                    Not available
                  </Button>
                ) : (
                  <Button
                    className="relative mt-6 rounded-full bg-slate-950 text-white hover:bg-slate-800"
                    disabled={paymentLoading === plan.code}
                    onClick={() => handleUpgrade(plan.code)}
                  >
                    {paymentLoading === plan.code
                      ? "Processing..."
                      : `Upgrade for ${formatPrice(plan.chargePaise)}`}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-4 rounded-[28px] border border-orange-200 bg-white px-6 py-5 shadow-[0_16px_40px_rgba(194,65,12,0.08)] md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Every successful upgrade sends a plan invoice by email
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The invoice includes your plan details, amount paid, Razorpay payment
              ID, order ID, and confirmation of lifetime access.
            </p>
          </div>
          <Link href="/downloads">
            <Button variant="outline" className="rounded-full">
              Review downloads
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
