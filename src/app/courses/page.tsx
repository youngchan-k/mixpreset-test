import CoursesContent from '@/components/courses/CoursesContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Mixing Courses | MIXPRESET',
  description: 'Learn professional mixing techniques with our comprehensive courses.',
};

export default function CoursesPage() {
  return <CoursesContent />;
}