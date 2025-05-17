import FAQContent from '@/components/faq/FAQContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | MIXPRESET',
  description: 'Find answers to common questions about MIXPRESET worldwide mixing and mastering platform, services, and features.',
};

export default function FAQPage() {
  return <FAQContent />;
}