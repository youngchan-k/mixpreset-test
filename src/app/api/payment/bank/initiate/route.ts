import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In a real application, this would be stored in a database
const pendingTransfers = new Map();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userData, planName, amount, credits } = data;

    if (!userData || !userData.uid || !userData.email) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Generate a unique reference code for this transfer
    const referenceCode = `MIX-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Store the pending transfer (in production, this would go to a database)
    pendingTransfers.set(referenceCode, {
      userId: userData.uid,
      userEmail: userData.email,
      planName,
      amount,
      credits,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    // Return the simplified bank details and reference code
    return NextResponse.json({
      success: true,
      referenceCode,
      bankDetails: {
        accountName: '\uD3B8\uC131\uC900 (Mixpreset Inc.)',
        accountNumber: '1000-6852-6003',
        bankName: 'Toss Bank'
      }
    });
  } catch (error) {
    console.error('Error initiating bank transfer:', error);
    return NextResponse.json({
      error: 'Failed to initiate bank transfer'
    }, { status: 500 });
  }
}