import PricingContent from '@/components/pricing/PricingContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | MIXPRESET',
  description: 'Explore our pricing plans for presets, mixing services, and courses.',
};

export default function PricingPage() {
  return <PricingContent />;
}