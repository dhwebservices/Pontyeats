import Stripe from 'stripe';

let _stripe = null;
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

// UK card: 1.4% + 20p
export const estimateStripeFee = (totalGbp) => +(totalGbp * 0.014 + 0.20).toFixed(2);
