export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  credits: number;
  price: number;
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
    credits: 10,
    price: 5.00,
    currency: 'usd',
    mode: 'payment',
    popular: false
  },
  {
    id: 'prod_TeLdw8nszDOeSB',
    priceId: 'price_1Sh2w9LkzHXwN84v8ZD66X1d',
    name: '25 Credits',
    description: 'Great for small projects',
    credits: 25,
    price: 10.00,
    currency: 'usd',
    mode: 'payment',
    popular: false
  },
  {
    id: 'prod_TeLeLMpbgCub5j',
    priceId: 'price_1Sh2wuLkzHXwN84vp1Og2GmI',
    name: '55 Credits',
    description: 'Most popular choice for regular users',
    credits: 55,
    price: 20.00,
    currency: 'usd',
    mode: 'payment',
    popular: true
  },
  {
    id: 'prod_TeLeQvEcL6Mvx6',
    priceId: 'price_1Sh2xdLkzHXwN84vuD2S6iF6',
    name: '150 Credits',
    description: 'Best value for power users',
    credits: 150,
    price: 50.00,
    currency: 'usd',
    mode: 'payment',
    popular: false
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const formatPrice = (price: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
};