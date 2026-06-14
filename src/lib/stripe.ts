import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

export const PLANS = {
  essential: {
    id: process.env.STRIPE_ESSENTIAL_PRICE_ID ?? "",
    name: "Essential",
    type: "one-time" as const,
    amount: 30000,
  },
  growth: {
    id: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    name: "Growth",
    type: "one-time" as const,
    amount: 60000,
  },
  premium: {
    id: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    name: "Premium",
    type: "one-time" as const,
    amount: 120000,
  },
  maintenance: {
    id: process.env.STRIPE_MAINTENANCE_PRICE_ID ?? "",
    name: "Monthly Maintenance",
    type: "subscription" as const,
    amount: 2500,
    interval: "month" as const,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanKey];
