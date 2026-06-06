export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  credits?: number;
  currency: string;
  mode: 'payment' | 'subscription';
  popular?: boolean;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TeLcVEKzMKRGiP',
    priceId: 'price_1Sh2v2LkzHXwN84vL4NqUfO7',
    name: '10 Credits',
    description: 'Perfect for trying out our service',
    price: 5.00,
    credits: 10,
    currency: 'usd',
    mode: 'payment',
    popular: false
  },
  {
    id: 'prod_TeLdw8nszDOeSB',
    priceId: 'price_1Sh2w9LkzHXwN84v8ZD66X1d',
    name: '25 Credits',
    description: 'Great for small projects',
    price: 10.00,
    credits: 25,
    currency: 'usd',
    mode: 'payment',
    popular: false
  },
  {
    id: 'prod_TeLeLMpbgCub5j',
    priceId: 'price_1Sh2wuLkzHXwN84vp1Og2GmI',
    name: '55 Credits',
    description: 'Most popular choice for regular users',
    price: 20.00,
    credits: 55,
    currency: 'usd',
    mode: 'payment',
    popular: true
  },
  {
    id: 'prod_TeLeQvEcL6Mvx6',
    priceId: 'price_1Sh2xdLkzHXwN84vuD2S6iF6',
    name: '150 Credits',
    description: 'Best value for power users',
    price: 50.00,
    credits: 150,
    currency: 'usd',
    mode: 'payment',
    popular: false
  },
  {
    id: 'prod_UeTQIUfl7c2jCJ',
    priceId: 'price_1TfATSLkzHXwN84vTL8upfBU',
    name: 'Custom',
    description: 'Enterprise & custom amount package',
    price: 6000.00,
    credits: 500,
    currency: 'usd',
    mode: 'payment',
    popular: false
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}
