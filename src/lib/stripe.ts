import Stripe from "stripe";

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) _stripe = createStripe();
  return _stripe;
}

interface PlanDef {
  envKey: string;
  name: string;
  description: string;
  amount: number;
  type: "one-time" | "subscription";
}

const PLAN_DEFS: Record<string, PlanDef> = {
  essential: {
    envKey: "STRIPE_ESSENTIAL_PRICE_ID",
    name: "Essential Website",
    description: "Perfect for a simple online presence — freelancers, side projects, or small local businesses.",
    amount: 30000,
    type: "one-time",
  },
  growth: {
    envKey: "STRIPE_GROWTH_PRICE_ID",
    name: "Growth Website",
    description: "Best for growing businesses that need a proper online presence that converts.",
    amount: 60000,
    type: "one-time",
  },
  premium: {
    envKey: "STRIPE_PREMIUM_PRICE_ID",
    name: "Premium Website",
    description: "Full-service build for serious businesses ready to dominate their market online.",
    amount: 120000,
    type: "one-time",
  },
  maintenance: {
    envKey: "STRIPE_MAINTENANCE_PRICE_ID",
    name: "Monthly Maintenance",
    description: "Ongoing website maintenance, updates, and support.",
    amount: 2500,
    type: "subscription",
  },
};

const _priceCache = new Map<string, string>();

async function ensurePriceId(planKey: string, def: PlanDef): Promise<string> {
  // 1. Check cache
  const cached = _priceCache.get(planKey);
  if (cached) return cached;

  // 2. Check env var
  const envId = process.env[def.envKey];
  if (envId && envId.startsWith("price_")) {
    _priceCache.set(planKey, envId);
    return envId;
  }

  // 3. Auto-create in Stripe
  const stripe = getStripe();
  const productName = `[Auto] ${def.name}`;

  // Try to find existing product (idempotent across cold starts)
  const existing = await stripe.products.list({
    active: true,
    limit: 100,
  });
  const match = existing.data.find((p) => p.name === productName);
  let productId: string;

  if (match) {
    productId = match.id;
  } else {
    const product = await stripe.products.create({
      name: productName,
      description: def.description,
      metadata: { autoCreated: "true", plan: planKey },
    });
    productId = product.id;
  }

  // Get or create the price for this product
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const existingPrice = prices.data.find((p) => p.unit_amount === def.amount);

  if (existingPrice) {
    _priceCache.set(planKey, existingPrice.id);
    return existingPrice.id;
  }

  const priceData: Stripe.PriceCreateParams = {
    currency: "aud",
    unit_amount: def.amount,
    product: productId,
  };
  if (def.type === "subscription") {
    priceData.recurring = { interval: "month" };
  }

  const price = await stripe.prices.create(priceData);
  _priceCache.set(planKey, price.id);
  return price.id;
}

export async function getPriceId(planKey: string): Promise<string> {
  const def = PLAN_DEFS[planKey];
  if (!def) throw new Error(`Unknown plan: ${planKey}`);
  return ensurePriceId(planKey, def);
}

export type PlanKey = keyof typeof PLAN_DEFS;
