'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import HeroSection from './HeroSection';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomeContent({ onNavigate }: HomePageProps) {
  return (
    <div className="bg-white">
      <HeroSection
        title="Worldwide Mixing and Mastering Platform"
        subtitle="Connect with authentic sound engineers worldwide, and get instant access to numerous presets ACTUALLY used in billboard songs "
        titleGradient={true}
        badge={{ text: "#1 GLOBAL MIXING PLATFORM" }}
        showWaveAnimation={false}
        showSocialProof={true}
        socialProofText="Trusted by music professionals and leading studios worldwide"
        height="large"
        animatedText={true}
        parallax={true}
        stats={[
          { label: "Presets", value: "500+" },
          { label: "Users", value: "10k+" },
          { label: "Rating", value: "4.9/5" }
        ]}
        buttons={
          <>
            <button
              onClick={() => onNavigate('presets')}
              className="bg-white text-purple-700 px-6 sm:px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              <span>Explore Presets</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="bg-transparent text-white border-2 border-white/80 px-6 sm:px-8 py-3 rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300"
            >
              View Pricing
            </button>
          </>
        }
      />

      {/* Features Section */}
      <div className="py-20 container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose MIXPRESET</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We are not an independent preset seller, we are a platform that sells authentic presets from grammy nominated albums to billboard albums.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Professional Quality</h3>
            <p className="text-gray-600 mb-4">
              Created by engineers with decades of experience in the music industry.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Studio-grade processing
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Optimized for all genres
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Regular updates
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Compatible with All DAWs</h3>
            <p className="text-gray-600 mb-4">
              Our presets work seamlessly with all major digital audio workstations.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Logic Pro
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                FL Studio
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ableton, Pro Tools & more
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Instant Results</h3>
            <p className="text-gray-600 mb-4">
              Save hours of tweaking with our ready-to-use professional presets.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                One-click application
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fully customizable
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Detailed documentation
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Presets Section */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left content */}
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">Premium Audio <span className="text-purple-600">Presets</span></h2>
              <p className="text-base leading-relaxed text-gray-600 mb-8">
              Browse our extensive presets for vocals and instruments that were used in grammy nominated songs and billboard hit songs. We have partnered with professionals who have worked with Dua Lipa, Blackpink, Bad Bunny, Shakira, Aespa and more.
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Vocal chains for all genres</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Instrument-specific processing</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Mastering presets for final polish</p>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('presets')}
                className="bg-purple-600 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Explore Presets
              </button>
            </div>

            {/* Right image */}
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-full h-full bg-purple-200 rounded-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-purple-400 rounded-xl"></div>
                <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
                  <div className="relative w-full aspect-w-16 aspect-h-9">
                    <Image
                      src="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                      alt="Audio mixing console"
                      className="rounded-xl"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={true}
                      quality={85}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row-reverse items-center">
            {/* Right content */}
            <div className="md:w-1/2 mb-10 md:mb-0 md:pl-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">Join Our <span className="text-purple-600">Community</span></h2>
              <p className="text-base leading-relaxed text-gray-600 mb-8">
                Connect with like-minded producers, share your work, and learn from industry professionals in our thriving community of music creators.
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Collaborate with producers worldwide</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Get feedback on your mixes from professionals</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Access exclusive community resources and events</p>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('community')}
                className="bg-purple-600 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Join Community
              </button>
            </div>

            {/* Left image */}
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-full h-full bg-purple-200 rounded-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-full h-full bg-purple-400 rounded-xl"></div>
                <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
                  <div className="relative w-full aspect-w-16 aspect-h-9">
                    <Image
                      src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80"
                      alt="Music producers collaborating"
                      className="rounded-xl"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={true}
                      quality={85}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left content */}
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">Master the Art of <span className="text-purple-600">Mixing</span></h2>
              <p className="text-base leading-relaxed text-gray-600 mb-8">
                Take your skills to the next level with our comprehensive mixing courses. Learn directly from industry professionals and transform your productions.
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Beginner to advanced courses</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Taught by Grammy-winning engineers</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-md text-gray-700">Practical, real-world examples</p>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('courses')}
                className="bg-purple-600 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View Courses
              </button>
            </div>

            {/* Right image - Updated with new image */}
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-full h-full bg-purple-200 rounded-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-purple-400 rounded-xl"></div>
                <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
                  <div className="relative w-full aspect-w-16 aspect-h-9">
                    <Image
                      src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80"
                      alt="Music producer working in studio"
                      className="rounded-xl"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={true}
                      quality={85}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      {/* <div className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6"><span className="text-purple-600">What</span> Our Customers Say</h2>
            <p className="text-base leading-relaxed text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied producers who have transformed their sound with MIXPRESET.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-base text-gray-800">James Wilson</h4>
                  <p className="text-gray-600 text-xs">Hip Hop Producer</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "These presets have completely transformed my workflow. I can get professional sounding vocals in minutes instead of hours."
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-base text-gray-800">Sarah Johnson</h4>
                  <p className="text-gray-600 text-xs">Indie Artist</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "The mixing course was a game-changer for me. I finally understand how to make my songs sound professional and radio-ready."
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-base text-gray-800">Michael Rodriguez</h4>
                  <p className="text-gray-600 text-xs">EDM Producer</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "The EDM presets are incredible. They've given my tracks that professional polish I've been struggling to achieve. Worth every penny!"
              </p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}