# Vercel Deployment Setup

This project uses Vercel for hosting serverless API functions and Supabase for the database.

## Environment Variables

You need to configure the following environment variables in your Vercel project settings:

### Supabase Configuration

```
# For client-side (browser) access
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For server-side (API functions) access
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Note:** The `VITE_` prefixed variables are for client-side use, while the non-prefixed versions are for serverless API functions.

### OpenAI Configuration

```
OPENAI_API_KEY=your_openai_api_key
```

### Stripe Configuration

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Setting Up Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Navigate to "Environment Variables"
4. Add each environment variable listed above
5. Make sure to add them for all environments (Production, Preview, Development)

## Webhook Configuration

After deploying to Vercel, you need to configure the Stripe webhook:

1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Click "Add endpoint"
4. Enter your webhook URL: `https://your-domain.vercel.app/api/stripe-webhook`
5. Select the following events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Vercel

## API Endpoints

The following API endpoints are available:

- `/api/generate-logo-with-credits` - Generate logos using OpenAI DALL-E 3
- `/api/stripe-checkout` - Create Stripe checkout sessions
- `/api/stripe-webhook` - Handle Stripe webhook events
- `/api/verify-payment` - Verify payment completion and return credit amount

## Local Development

To run the project locally with Vercel:

1. Install Vercel CLI: `npm install -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull`
4. Run the development server: `vercel dev`

## Database

The project uses Supabase for database management. All database operations are handled through the Supabase client, with Row Level Security (RLS) policies enforcing access control.

## Deployment

To deploy to Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables as listed above
3. Deploy using: `vercel --prod` or push to your main branch for automatic deployment

Vercel will automatically detect the `vercel.json` configuration and deploy your serverless functions.
