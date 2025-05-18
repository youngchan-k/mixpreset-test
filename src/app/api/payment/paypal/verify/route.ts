import { NextResponse } from 'next/server';
import { recordPayment } from '@/lib/paymentTracking';

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

    // In a production environment, you would verify the payment with PayPal API:
    // const verified = await verifyWithPayPalAPI(orderID);

    // For now, we'll assume the transaction is valid if orderID exists
    // This should be replaced with actual PayPal verification in production
    if (!orderID) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Record payment in your system
    if (userData && userData.uid && userData.email) {
      await recordPayment(
        userData.uid,
        userData.email,
        planName,
        'one-time',
        amount,
        credits,
        'PayPal'
      );
    } else {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and recorded'
    });
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return NextResponse.json({
      error: 'Payment verification failed'
    }, { status: 500 });
  }
}