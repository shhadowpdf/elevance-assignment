export type PlanCode = "free" | "bronze" | "silver" | "gold";

type PlanConfig = {
  code: PlanCode;
  name: string;
  rank: number;
  pricePaise: number;
  watchLimitMinutes: number | null;
  watchLimitSeconds: number | null;
  description: string;
  accent: string;
};

export const PLAN_CONFIG: Record<PlanCode, PlanConfig> = {
  free: {
    code: "free",
    name: "Free",
    rank: 0,
    pricePaise: 0,
    watchLimitMinutes: 5,
    watchLimitSeconds: 5 * 60,
    description: "Watch up to 5 minutes per video and download one video each day.",
    accent: "from-stone-200 via-stone-100 to-white",
  },
  bronze: {
    code: "bronze",
    name: "Bronze",
    rank: 1,
    pricePaise: 1000,
    watchLimitMinutes: 7,
    watchLimitSeconds: 7 * 60,
    description: "Stretch every video to 7 minutes and download one video each day.",
    accent: "from-amber-300 via-orange-200 to-white",
  },
  silver: {
    code: "silver",
    name: "Silver",
    rank: 2,
    pricePaise: 5000,
    watchLimitMinutes: 10,
    watchLimitSeconds: 10 * 60,
    description: "Get 10-minute access per video and download one video each day.",
    accent: "from-slate-300 via-slate-100 to-white",
  },
  gold: {
    code: "gold",
    name: "Gold",
    rank: 3,
    pricePaise: 10000,
    watchLimitMinutes: null,
    watchLimitSeconds: null,
    description: "Unlock unlimited watching time and unlimited downloads.",
    accent: "from-yellow-300 via-orange-200 to-white",
  },
};

export const PLAN_ORDER: PlanCode[] = ["free", "bronze", "silver", "gold"];

export const getPlanConfig = (planCode?: string | null): PlanConfig =>
  PLAN_CONFIG[(planCode as PlanCode) || "free"] || PLAN_CONFIG.free;

export const getEffectivePlanCode = (user?: {
  planCode?: string | null;
  isPremium?: boolean;
} | null): PlanCode => {
  if (user?.planCode && PLAN_CONFIG[user.planCode as PlanCode]) {
    return user.planCode as PlanCode;
  }

  return user?.isPremium ? "gold" : "free";
};

export const isPaidPlan = (planCode?: string | null) =>
  getPlanConfig(planCode).rank > 0;

export const calculateUpgradeChargePaise = (
  currentPlanCode: PlanCode,
  targetPlanCode: PlanCode
) => {
  const currentPlan = getPlanConfig(currentPlanCode);
  const targetPlan = getPlanConfig(targetPlanCode);

  if (targetPlan.rank <= currentPlan.rank) {
    return null;
  }

  return targetPlan.pricePaise - currentPlan.pricePaise;
};

export const formatWatchLimit = (watchLimitMinutes: number | null) =>
  watchLimitMinutes === null ? "Unlimited" : `${watchLimitMinutes} min/video`;

export const formatPrice = (amountPaise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
