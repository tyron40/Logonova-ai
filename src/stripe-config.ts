export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
  credits: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TeLeQvEcL6Mvx6',
    priceId: 'price_1Sh2xdLkzHXwN84vuD2S6iF6',
    name: '150 Credits',
    description: '150 credits',
    price: 5000, // in cents
    currency: 'usd',
    mode: 'payment',
    credits: 150,
  },
  {
    id: 'prod_TeLeLMpbgCub5j',
    priceId: 'price_1Sh2wuLkzHXwN84vp1Og2GmI',
    name: '55 Credits',
    description: '55 credits',
    price: 2000, // in cents
    currency: 'usd',
    mode: 'payment',
    credits: 55,
  },
  {
    id: 'prod_TeLdw8nszDOeSB',
    priceId: 'price_1Sh2w9LkzHXwN84v8ZD66X1d',
    name: '25 Credits',
    description: '25 credits',
    price: 1000, // in cents
    currency: 'usd',
    mode: 'payment',
    credits: 25,
  },
  {
    id: 'prod_TeLcVEKzMKRGiP',
    priceId: 'price_1Sh2v2LkzHXwN84vL4NqUfO7',
    name: '10 Credits',
    description: '10 credits',
    price: 500, // in cents
    currency: 'usd',
    mode: 'payment',
    credits: 10,
  },
];

export const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};