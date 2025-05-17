import { Metadata } from 'next';
import ContactContent from '@/components/ContactContent';

export const metadata: Metadata = {
  title: 'Contact Us | MIXPRESET',
  description: 'Get in touch with our team for support or inquiries about our presets and services.',
};

export default function ContactPage() {
  return <ContactContent />;
}