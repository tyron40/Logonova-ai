export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number; // in dollars
  credits?: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_UeTQIUfl7c2jCJ',
    priceId: 'price_1TfATSLkzHXwN84vTL8upfBU',
    name: 'Custom',
    description: 'custom amount',
    price: 60.00,
    currency: 'usd',
    mode: 'payment'
  },
  {
    id: 'prod_TeLeQvEcL6Mvx6',
    priceId: 'price_1Sh2xdLkzHXwN84vuD2S6iF6',
    name: '150 Credits',
    description: '150 credits',
    price: 50.00,
    credits: 150,
    currency: 'usd',
    mode: 'payment'
  },
  {
    id: 'prod_TeLeLMpbgCub5j',
    priceId: 'price_1Sh2wuLkzHXwN84vp1Og2GmI',
    name: '55 Credits',
    description: '55 credits',
    price: 20.00,
    credits: 55,
    currency: 'usd',
    mode: 'payment'
  },
  {
    id: 'prod_TeLdw8nszDOeSB',
    priceId: 'price_1Sh2w9LkzHXwN84v8ZD66X1d',
    name: '25 Credits',
    description: '25 credits',
    price: 10.00,
    credits: 25,
    currency: 'usd',
    mode: 'payment'
  },
  {
    id: 'prod_TeLcVEKzMKRGiP',
    priceId: 'price_1Sh2v2LkzHXwN84vL4NqUfO7',
    name: '10 Credits',
    description: '10 credits',
    price: 5.00,
    credits: 10,
    currency: 'usd',
    mode: 'payment'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}