'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import HeroSection from '../HeroSection';

// Define course types and data
type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type CourseCategory = 'All' | 'Mixing' | 'Mastering' | 'Production' | 'Vocals';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  category: CourseCategory;
  imageSrc: string;
  duration: string;
  featured?: boolean;
  instructor: string;
}

// Sample course data
const courses: Course[] = [
  {
    id: 'mixing-fundamentals',
    title: 'Mixing Fundamentals',
    description: 'Learn the core principles of audio mixing from professional engineers.',
    price: 99.99,
    level: 'Beginner',
    category: 'Mixing',
    imageSrc: '/images/preset-1.jpg',
    duration: '6 hours',
    instructor: 'John Smith',
    featured: true
  },
  {
    id: 'vocal-production-masterclass',
    title: 'Vocal Production Masterclass',
    description: 'Take your vocal mixes to the next level with advanced techniques.',
    price: 129.99,
    level: 'Intermediate',
    category: 'Vocals',
    imageSrc: '/images/preset-2.jpg',
    duration: '8 hours',
    instructor: 'Sarah Johnson',
    featured: true
  },
  {
    id: 'mastering-essentials',
    title: 'Mastering Essentials',
    description: 'Learn how to master your tracks for release on any platform.',
    price: 149.99,
    level: 'Intermediate',
    category: 'Mastering',
    imageSrc: '/images/preset-3.jpg',
    duration: '10 hours',
    instructor: 'Michael Brown'
  },
  {
    id: 'music-production-101',
    title: 'Music Production 101',
    description: 'Complete guide to producing music from start to finish.',
    price: 89.99,
    level: 'Beginner',
    category: 'Production',
    imageSrc: '/images/preset-1.jpg',
    duration: '12 hours',
    instructor: 'Emily Williams'
  },
  {
    id: 'advanced-mixing-techniques',
    title: 'Advanced Mixing Techniques',
    description: 'Take your mixing skills to professional level with advanced concepts.',
    price: 179.99,
    level: 'Advanced',
    category: 'Mixing',
    imageSrc: '/images/preset-2.jpg',
    duration: '15 hours',
    instructor: 'David Miller'
  },
  {
    id: 'vocal-processing-deep-dive',
    title: 'Vocal Processing Deep Dive',
    description: 'In-depth course on processing vocals for any genre.',
    price: 139.99,
    level: 'Advanced',
    category: 'Vocals',
    imageSrc: '/images/preset-3.jpg',
    duration: '9 hours',
    instructor: 'Jessica Taylor'
  }
];

export default function CoursesContent() {
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('All');
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  // Handle image load errors
  const handleImageError = (id: string) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  // Filter courses by category
  const filteredCourses = activeCategory === 'All'
    ? courses
    : courses.filter(course => course.category === activeCategory);

  const categories: CourseCategory[] = ['All', 'Mixing', 'Mastering', 'Production', 'Vocals'];

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <HeroSection
        title="Audio Mixing Courses"
        subtitle="Master the art of mixing with comprehensive courses taught by industry professionals."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "EXPERT TRAINING" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Browse Section */}
      <section id="browse" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Category Filters */}
            <div className="mb-12">
              <h2 className="heading-lg text-center mb-8 text-gray-900">Browse Courses</h2>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm sm:text-base transition-colors ${
                      activeCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map(course => (
                <div key={course.id} className="card group cursor-pointer">
                  <div className="relative h-60 w-full">
                    {imageError[course.id] ? (
                      <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-700">{course.title}</span>
                      </div>
                    ) : (
                      <Image
                        src={course.imageSrc}
                        alt={course.title}
                        className="rounded-t-lg object-cover w-full h-full"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => handleImageError(course.id)}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        course.level === 'Beginner' ? 'bg-green-500' :
                        course.level === 'Intermediate' ? 'bg-yellow-500' :
                        'bg-red-500'
                      } text-white font-medium`}>
                        {course.level}
                      </span>
                      <span className="inline-block ml-2 px-2 py-1 bg-gray-800 text-xs rounded-full text-white font-medium">
                        {course.duration}
                      </span>
                    </div>
                    {course.featured && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{course.title}</h3>
                      <span className="text-purple-600 font-bold">${course.price.toFixed(2)}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{course.description}</p>
                    <p className="text-sm text-gray-700 mb-4">Instructor: {course.instructor}</p>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-purple-600 font-medium flex items-center group-hover:text-purple-800 transition-colors"
                    >
                      View Course
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-700 text-lg">No courses found in this category. Please try another category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="heading-lg text-gray-900 mb-4">What You'll Get</h2>
            <p className="text-xl text-gray-700">
              Our courses are designed to provide you with a comprehensive learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">HD Video Lessons</h3>
              <p className="text-gray-700">
                High-quality video lessons with step-by-step instructions and demonstrations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Downloadable Resources</h3>
              <p className="text-gray-700">
                Practice files, project templates, and additional learning materials.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Community Support</h3>
              <p className="text-gray-700">
                Access to our private community for feedback and support from instructors and peers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}