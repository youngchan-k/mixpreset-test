// Next.js special type declarations
import { Metadata } from 'next';

declare module 'next' {
  export interface PageProps {
    params: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
  }
}