import CommunityContent from '@/components/community/CommunityContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community | MIXPRESET',
  description: 'Join our community of audio professionals and enthusiasts. Connect via Discord and more.',
};

export default function CommunityPage() {
  return <CommunityContent />;
}