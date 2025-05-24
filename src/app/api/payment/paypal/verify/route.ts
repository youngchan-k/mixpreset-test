import { NextResponse } from 'next/server';
import { recordPayment } from '@/lib/paymentTracking';

// PayPal API base URL - using production PayPal API
const PAYPAL_API_BASE = 'https://api-m.paypal.com';

// Function to get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Function to verify payment with PayPal API
async function verifyPayPalPayment(orderID: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal API error: ${response.status}`);
  }

  return await response.json();
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      orderID,
      transactionDetails,
      userData,
      planName,
      amount,
      credits
    } = data;

    if (!orderID) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    if (!userData || !userData.uid || !userData.email) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Verify the payment with PayPal API
    let verifiedPayment;
    try {
      verifiedPayment = await verifyPayPalPayment(orderID);
    } catch (verifyError) {
      console.error('PayPal verification failed:', verifyError);
      return NextResponse.json({
        error: 'Payment verification failed with PayPal'
      }, { status: 400 });
    }

    // Check if payment was completed successfully
    if (verifiedPayment.status !== 'COMPLETED') {
      return NextResponse.json({
        error: `Payment not completed. Status: ${verifiedPayment.status}`
      }, { status: 400 });
    }

    // Verify the payment amount matches what was expected
    const paidAmount = parseFloat(verifiedPayment.purchase_units[0]?.amount?.value || '0');
    if (Math.abs(paidAmount - amount) > 0.01) { // Allow for small floating point differences
      return NextResponse.json({
        error: 'Payment amount mismatch'
      }, { status: 400 });
    }

    // Record payment in your system
    await recordPayment(
      userData.uid,
      userData.email,
      planName,
      'one-time',
      amount,
      credits,
      'PayPal',
      orderID,
      verifiedPayment
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified and recorded',
      verifiedAmount: paidAmount,
      paymentStatus: verifiedPayment.status
    });
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return NextResponse.json({
      error: 'Payment verification failed'
    }, { status: 500 });
  }
}