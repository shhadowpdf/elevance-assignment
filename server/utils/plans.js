export const PLAN_DEFINITIONS = {
  free: {
    code: "free",
    name: "Free",
    rank: 0,
    pricePaise: 0,
    watchLimitMinutes: 5,
    watchLimitSeconds: 5 * 60,
    isPaid: false,
  },
  bronze: {
    code: "bronze",
    name: "Bronze",
    rank: 1,
    pricePaise: 1000,
    watchLimitMinutes: 7,
    watchLimitSeconds: 7 * 60,
    isPaid: true,
  },
  silver: {
    code: "silver",
    name: "Silver",
    rank: 2,
    pricePaise: 5000,
    watchLimitMinutes: 10,
    watchLimitSeconds: 10 * 60,
    isPaid: true,
  },
  gold: {
    code: "gold",
    name: "Gold",
    rank: 3,
    pricePaise: 10000,
    watchLimitMinutes: null,
    watchLimitSeconds: null,
    isPaid: true,
  },
};

const LEGACY_PREMIUM_PLAN_CODE = "gold";

export const getPlan = (planCode = "free") =>
  PLAN_DEFINITIONS[planCode] || PLAN_DEFINITIONS.free;

export const isPaidPlanCode = (planCode = "free") => getPlan(planCode).isPaid;

export const getUpgradeChargePaise = (currentPlanCode, targetPlanCode) => {
  const currentPlan = getPlan(currentPlanCode);
  const targetPlan = getPlan(targetPlanCode);

  if (targetPlan.rank <= currentPlan.rank) {
    return null;
  }

  return targetPlan.pricePaise - currentPlan.pricePaise;
};

export const getVideoUploadQuota = (planCode = "free") => {
  switch (getPlan(planCode).code) {
    case "bronze":
      return 5;
    case "silver":
      return 10;
    case "gold":
      return Number.POSITIVE_INFINITY;
    default:
      return 1;
  }
};

export const getNormalizedPlanData = (userLike = {}) => {
  const inferredPlanCode =
    userLike.planCode && PLAN_DEFINITIONS[userLike.planCode]
      ? userLike.planCode
      : userLike.isPremium
        ? LEGACY_PREMIUM_PLAN_CODE
        : "free";

  const plan = getPlan(inferredPlanCode);

  return {
    planCode: plan.code,
    planName: plan.name,
    watchLimitMinutes: plan.watchLimitMinutes,
    planPricePaise: plan.pricePaise,
    planActivatedAt:
      userLike.planActivatedAt ||
      (plan.isPaid ? userLike.joinedon || new Date() : null),
    isPremium: plan.isPaid,
  };
};

export const needsPlanMigration = (userLike = {}) => {
  const normalizedPlan = getNormalizedPlanData(userLike);

  return (
    userLike.planCode !== normalizedPlan.planCode ||
    userLike.planName !== normalizedPlan.planName ||
    userLike.watchLimitMinutes !== normalizedPlan.watchLimitMinutes ||
    userLike.planPricePaise !== normalizedPlan.planPricePaise ||
    userLike.isPremium !== normalizedPlan.isPremium ||
    (normalizedPlan.isPremium &&
      !userLike.planActivatedAt &&
      Boolean(normalizedPlan.planActivatedAt))
  );
};

export const applyPlanToUser = (userDoc, planCode, activatedAt = new Date()) => {
  const plan = getPlan(planCode);
  userDoc.planCode = plan.code;
  userDoc.planName = plan.name;
  userDoc.watchLimitMinutes = plan.watchLimitMinutes;
  userDoc.planPricePaise = plan.pricePaise;
  userDoc.planActivatedAt = plan.isPaid ? activatedAt : null;
  userDoc.isPremium = plan.isPaid;
  return userDoc;
};

export const hydrateUserPlan = async (userDoc) => {
  if (!userDoc || !needsPlanMigration(userDoc)) {
    return userDoc;
  }

  const normalizedPlan = getNormalizedPlanData(userDoc);
  userDoc.planCode = normalizedPlan.planCode;
  userDoc.planName = normalizedPlan.planName;
  userDoc.watchLimitMinutes = normalizedPlan.watchLimitMinutes;
  userDoc.planPricePaise = normalizedPlan.planPricePaise;
  userDoc.planActivatedAt = normalizedPlan.planActivatedAt;
  userDoc.isPremium = normalizedPlan.isPremium;
  await userDoc.save();
  return userDoc;
};

export const serializeUser = (userLike) => {
  if (!userLike) {
    return null;
  }

  const baseUser =
    typeof userLike.toObject === "function" ? userLike.toObject() : userLike;
  const normalizedPlan = getNormalizedPlanData(baseUser);

  return {
    ...baseUser,
    id:
      typeof baseUser._id?.toString === "function"
        ? baseUser._id.toString()
        : baseUser.id,
    ...normalizedPlan,
  };
};
