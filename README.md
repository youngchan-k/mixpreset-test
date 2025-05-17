This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# MixPreset Web Application

## S3 Data Handling Implementation

The application fetches data from AWS S3 using a centralized approach to prevent redundant network requests:

1. **PresetSync.tsx** - The central component responsible for fetching preset data from S3
   - Fetches and caches preset metadata, image URLs, audio files, and other assets
   - Stores this data in the React context via PresetsContext.tsx
   - Other components should use this already fetched data rather than making direct S3 requests

2. **PresetDetail.tsx** - Now uses the `getPresetFileUrl` function which:
   - First tries to find requested files in already fetched preset data
   - Only falls back to constructing direct S3 URLs as a last resort
   - This prevents redundant network calls and improves performance

3. **PresetsContent.tsx** - Leverages the PresetSync component to display presets
   - Uses the context data from PresetsContext without additional S3 requests

### Benefits of this approach:

- Reduces network requests to S3
- Improves application performance
- Ensures consistency of data across the application
- Makes the app more resilient to network issues

### Implementation Notes:

When working with S3 data in this application:
- Always check if the data is already available in the PresetsContext first
- Only make direct S3 requests for data that isn't already fetched
- If you need to add new S3 data sources, add them to PresetSync.tsx when possible

## PayPal Integration

The application integrates PayPal for payment processing using the `@paypal/react-paypal-js` library:

1. **PaymentMethodModal** - Offers three payment options:
   - PayPal - Uses the PayPal SDK for secure payments
   - Polar - For Polar.sh platform payments
   - Bank Transfer - For manual wire transfers

2. **Environment Setup**:
   - Create a `.env.local` file at the project root
   - Add your PayPal client ID: `NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here`
   - You can obtain a client ID from the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)

3. **Testing PayPal Integration**:
   - For development, you can use PayPal's sandbox environment
   - Set up a sandbox account at [developer.paypal.com](https://developer.paypal.com/)
   - Use the sandbox client ID in your `.env.local` file

### PayPal Payment Flow:

1. User selects a plan to purchase
2. User selects PayPal as the payment method
3. User clicks the Pay button
4. PayPal checkout interface appears
5. After successful payment, credits are added to the user's account
