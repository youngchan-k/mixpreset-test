import { NextResponse } from 'next/server';
import { recordPayment } from '@/lib/paymentTracking';

// In a real app, this would be authenticated and would pull from a database
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { referenceCode, adminKey } = data;

    // Basic admin authentication (would be much more secure in production)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // In a real app, this would fetch from a database
    // For this example, we'll assume the transfer with this reference code exists
    // and has been confirmed via your bank's transaction history

    // Mock payment data (in production, get this from database)
    const mockPaymentData = {
      userId: 'user123',
      userEmail: 'user@example.com',
      planName: 'Premium Plan',
      amount: 99.99,
      credits: 1000
    };

    // Record the payment in your system
    await recordPayment(
      mockPaymentData.userId,
      mockPaymentData.userEmail,
      mockPaymentData.planName,
      'one-time',
      mockPaymentData.amount,
      mockPaymentData.credits,
      'Bank Transfer'
    );

    // In a real app, update the transfer status in the database

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Bank transfer with reference ${referenceCode} has been verified and processed`
    });
  } catch (error) {
    console.error('Error verifying bank transfer:', error);
    return NextResponse.json({
      error: 'Failed to verify bank transfer'
    }, { status: 500 });
  }
}