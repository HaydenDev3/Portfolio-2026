import Stripe from "stripe";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/seed-stripe.mjs");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2025-03-31.basil" });

const products = [
  {
    name: "Essential Website",
    desc: "Perfect for a simple online presence — freelancers, side projects, or small local businesses.",
    amount: 30000,
    type: "one-time",
  },
  {
    name: "Growth Website",
    desc: "Best for growing businesses that need a proper online presence that converts.",
    amount: 60000,
    type: "one-time",
  },
  {
    name: "Premium Website",
    desc: "Full-service build for serious businesses ready to dominate their market online.",
    amount: 120000,
    type: "one-time",
  },
  {
    name: "Monthly Maintenance",
    desc: "Ongoing website maintenance, updates, and support.",
    amount: 2500,
    type: "recurring",
  },
];

const envMap = {
  "Essential Website": "STRIPE_ESSENTIAL_PRICE_ID",
  "Growth Website": "STRIPE_GROWTH_PRICE_ID",
  "Premium Website": "STRIPE_PREMIUM_PRICE_ID",
  "Monthly Maintenance": "STRIPE_MAINTENANCE_PRICE_ID",
};

const results = {};

for (const p of products) {
  console.log(`Creating "${p.name}"...`);

  const prod = await stripe.products.create({
    name: p.name,
    description: p.desc,
  });

  const priceData = {
    currency: "aud",
    unit_amount: p.amount,
    product: prod.id,
  };

  if (p.type === "recurring") {
    priceData.recurring = { interval: "month" };
  }

  const price = await stripe.prices.create(priceData);
  const envKey = envMap[p.name];
  results[envKey] = price.id;
  console.log(`  ✅ ${price.id} (prod: ${prod.id})`);
}

// Try updating .env.local automatically
const envPath = resolve(".env.local");
if (existsSync(envPath)) {
  let env = readFileSync(envPath, "utf-8");
  for (const [key, val] of Object.entries(results)) {
    const regex = new RegExp(`^${key}=".*"`, "m");
    if (regex.test(env)) {
      env = env.replace(regex, `${key}="${val}"`);
    } else {
      env += `\n${key}="${val}"`;
    }
  }
  writeFileSync(envPath, env);
  console.log("\n✅ .env.local updated automatically with price IDs");
} else {
  console.log("\n--- Paste these into .env.local ---");
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}="${val}"`);
  }
}
