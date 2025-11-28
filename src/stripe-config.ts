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
    id: 'prod_TUBndlMGxkWTop',
    priceId: 'price_1SXDQDLkzHXwN84vsj54I3Ly', // Make sure this matches your actual Stripe price ID
    name: '10 Credits',
    description: 'Perfect for trying out our service',
    credits: 10,
    price: 5.00,
    currency: 'usd',
    mode: 'subscription',
    popular: false
  },
  {
    id: 'prod_TUBoIGsyoITwlf',
    priceId: 'price_1SXDR5LkzHXwN84vNGKH0EJH', // Make sure this matches your actual Stripe price ID
    name: '25 Credits',
    description: 'Great for small projects',
    credits: 25,
    price: 10.00,
    currency: 'usd',
    mode: 'subscription',
    popular: false
  },
  {
    id: 'prod_TUBqsv9uKjI2jb',
    priceId: 'price_1SXDSPLkzHXwN84vLo9kQlbE', // Make sure this matches your actual Stripe price ID
    name: '55 Credits',
    description: 'Most popular choice for regular users',
    credits: 55,
    price: 20.00,
    currency: 'usd',
    mode: 'subscription',
    popular: true
  },
  {
    id: 'prod_TUBqmCe1jbZeQA',
    priceId: 'price_1SXDSoLkzHXwN84vSe77zkio', // Make sure this matches your actual Stripe price ID
    name: '150 Credits',
    description: 'Best value for power users',
    credits: 150,
    price: 50.00,
    currency: 'usd',
    mode: 'subscription',
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