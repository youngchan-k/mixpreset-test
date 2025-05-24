# Polar.sh Integration Setup

This project integrates with Polar.sh for payment processing. Follow these steps to set up the integration:

## Environment Variables

You need to set the following environment variables in your Vercel dashboard:

### Required Variables

1. **POLAR_ACCESS_TOKEN**
   - Go to your Polar organization settings
   - Create an organization access token
   - Add this token to Vercel environment variables
   - Example: `polar_pat_your_token_here`

2. **POLAR_WEBHOOK_SECRET**
   - In your Polar organization settings, go to Webhooks
   - Create a new webhook endpoint pointing to: `https://your-domain.vercel.app/api/webhook/polar`
   - Generate a secret key for the webhook
   - Add this secret to Vercel environment variables
   - Example: `whsec_your_webhook_secret_here`

### Environment Configuration

- **Development**: The app automatically uses Polar's sandbox environment when `NODE_ENV !== 'production'`
- **Production**: The app uses Polar's production environment when deployed to Vercel

## Webhook Setup

1. In your Polar organization settings, navigate to Webhooks
2. Click "Add Endpoint"
3. Set the URL to: `https://your-domain.vercel.app/api/webhook/polar`
4. Select the events you want to receive (recommended: `order.created`, `customer.state.changed`)
5. Generate and save the webhook secret
6. Add the secret to your Vercel environment variables as `POLAR_WEBHOOK_SECRET`

## Testing

### Local Development
1. Use ngrok to tunnel your local development server: `ngrok http 3000`
2. Update your webhook URL in Polar to point to your ngrok URL: `https://your-ngrok-id.ngrok-free.app/api/webhook/polar`
3. Test payments using Polar's sandbox environment

### Production
1. Deploy to Vercel with the environment variables set
2. Update your webhook URL in Polar to point to your production domain
3. Switch to Polar's production environment for live payments

## Checkout Flow

The integration provides two checkout endpoints:

1. **Main Checkout**: `/checkout` - Primary checkout route as per Polar documentation
2. **API Checkout**: `/api/checkout/polar` - Alternative checkout route for specific use cases

Both routes redirect to `/profile/credits?checkout_id={CHECKOUT_ID}&payment_success=true` on success, where your existing confirmation modal system will handle the success display.

## Webhook Events

The webhook handler processes the following events:

- `order.created` - Processes successful payments and updates user credits
- `customer.state.changed` - Handles customer state changes
- All events are logged for debugging purposes

## Troubleshooting

1. **Webhook not receiving events**: Check that your webhook URL is accessible and the secret matches
2. **Environment variables not working**: Ensure variables are set in Vercel and the deployment has been redeployed
3. **Sandbox vs Production**: Make sure you're using the correct environment tokens and webhook URLs 