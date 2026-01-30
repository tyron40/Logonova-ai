export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price_per_unit: number;
  currency_symbol: string;
  mode: 'payment' | 'subscription';
  credits: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TeLeQvEcL6Mvx6',
    priceId: 'price_1Sh2xdLkzHXwN84vuD2S6iF6',
    name: '150 Credits',
    description: '150 credits',
    price_per_unit: 50.00,
    currency_symbol: '$',
    mode: 'payment',
    credits: 150
  },
  {
    id: 'prod_TeLeLMpbgCub5j',
    priceId: 'price_1Sh2wuLkzHXwN84vp1Og2GmI',
    name: '55 Credits',
    description: '55 credits',
    price_per_unit: 20.00,
    currency_symbol: '$',
    mode: 'payment',
    credits: 55
  },
  {
    id: 'prod_TeLdw8nszDOeSB',
    priceId: 'price_1Sh2w9LkzHXwN84v8ZD66X1d',
    name: '25 Credits',
    description: '25 credits',
    price_per_unit: 10.00,
    currency_symbol: '$',
    mode: 'payment',
    credits: 25
  },
  {
    id: 'prod_TeLcVEKzMKRGiP',
    priceId: 'price_1Sh2v2LkzHXwN84vL4NqUfO7',
    name: '10 Credits',
    description: '10 credits',
    price_per_unit: 5.00,
    currency_symbol: '$',
    mode: 'payment',
    credits: 10
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};