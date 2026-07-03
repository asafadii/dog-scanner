import "server-only";

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

export const STRIPE_PRICES = {
  dora: process.env.STRIPE_PRICE_ID_DORA!,
  dora_unlimited: process.env.STRIPE_PRICE_ID_DORA_UNLIMITED!,
} as const;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";
