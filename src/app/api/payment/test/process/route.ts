import { NextResponse } from 'next/server';
import { recordPayment } from '@/lib/paymentTracking';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userData, planName, amount, credits } = data;

    // Validate only user data
    if (!userData || !userData.uid || !userData.email) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Set defaults for test payment if values are missing
    const testPlanName = planName || "Test Plan";
    const testAmount = amount || 0;
    const testCredits = credits || 100; // Default to 100 credits for testing

    // Generate a test transaction ID
    const transactionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[Test Payment] Processing payment for user ${userData.email} (${userData.uid})`);
    console.log(`[Test Payment] Plan: ${testPlanName}, Amount: $${testAmount}, Credits: ${testCredits}`);

    // Check if this is a test user (userId starts with "test_user_")
    const isTestUser = userData.uid.startsWith('test_user_');

    // Only record payment in DynamoDB if it's not a test user
    if (!isTestUser) {
      // Record the payment in the payment tracking system
      await recordPayment(
        userData.uid,
        userData.email,
        testPlanName,
        'one-time',
        testAmount,
        testCredits,
        'Test Payment',
        transactionId,
        { testPayment: true, timestamp: new Date().toISOString() }
      );
      console.log(`[Test Payment] Payment recorded successfully with transaction ID: ${transactionId}`);
    } else {
      console.log(`[Test Payment] Test user detected - skipping DynamoDB recording for user ${userData.uid}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Test payment processed successfully',
      transactionId,
      credits: testCredits,
      planName: testPlanName,
      amount: testAmount
    });
  } catch (error) {
    console.error('[Test Payment] Error processing test payment:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process test payment'
    }, {
      status: 500
    });
  }
}