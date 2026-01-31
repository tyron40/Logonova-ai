# LogoNova AI Setup Guide

Your app is now connected to your Supabase instance and ready to use!

## Quick Start

### 1. Sign Up / Sign In
- Visit your app and create an account or sign in
- Your account will be created in your Supabase database

### 2. Add Your OpenAI API Key
**Required for logo generation**

1. Click the profile icon in the top right corner
2. Select "Account Settings"
3. Scroll to the "OpenAI API Key" section
4. Get a free API key from: https://platform.openai.com/api-keys
5. Paste your key (starts with `sk-`) and click "Save API Key"

### 3. Purchase Credits
- Click "Buy Credits" in the header
- Select a credit package
- Complete payment through Stripe
- Credits will be added automatically to your account

### 4. Generate Logos
- Each logo generation costs 1 credit
- Enter your business name and details
- Click "Generate Logo"
- Download your logo when ready

## What's Already Configured

✅ **Supabase Database**
- Connected to: https://wnycubcboajvnzbjlbkg.supabase.co
- All tables created with Row Level Security enabled
- User authentication ready

✅ **Edge Functions Deployed**
- `generate-logo-with-credits` - Generates logos and deducts credits
- `enhance-description` - AI-powered description enhancement
- `stripe-checkout` - Creates payment sessions
- `stripe-webhook` - Handles payment confirmations
- `verify-payment` - Verifies payment status

✅ **Stripe Integration**
- Live mode enabled
- Webhook configured
- Credit purchases ready

## User Flow

```
1. User signs up
   ↓
2. User adds OpenAI API key in Account Settings
   ↓
3. User purchases credits via Stripe
   ↓
4. User generates logos (1 credit per logo)
   ↓
5. Credits automatically deducted
   ↓
6. User downloads their logo
```

## Important Notes

- **Each user provides their own OpenAI API key** - This keeps costs transparent and allows users to control their AI usage
- **Credits never expire** - Users can purchase credits and use them whenever needed
- **Secure storage** - User API keys are stored encrypted in Supabase
- **Rate limits** - OpenAI has rate limits on their API, so heavy usage may require upgraded API tiers

## Troubleshooting

**"OpenAI API key not configured" error?**
- Go to Account Settings and add your OpenAI API key

**"Insufficient credits" error?**
- Purchase more credits through the "Buy Credits" button

**Logo generation slow?**
- OpenAI's DALL-E 3 can take 10-30 seconds per image
- Using HD quality for best results

## Support

For issues with:
- **Payments**: Check your Stripe dashboard
- **Database**: Check your Supabase dashboard
- **API Keys**: Verify your OpenAI API key at platform.openai.com

---

**Ready to go!** Your users can now sign up and start generating logos.
