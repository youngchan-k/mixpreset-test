import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For Firebase auth, we can't easily check auth in middleware
  // since Firebase handles auth client-side
  // So we'll disable middleware protection and rely on client-side checks

  return NextResponse.next();
}

// Configure the middleware to match specific paths
export const config = {
  matcher: [
    // Match specific paths, exclude static assets and logo files
    '/((?!api|_next/static|_next/image|logo).*)',
  ],
};