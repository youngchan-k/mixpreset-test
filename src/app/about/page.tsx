import { Metadata } from 'next';
import Image from 'next/image';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'About Us | MIXPRESET',
  description: 'Learn about MIXPRESET, our mission, and the team behind our worldwide mixing and mastering platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="About MIXPRESET"
        subtitle="We're on a mission to connect artists with professional engineers worldwide, creating a global platform for mixing and mastering excellence."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "OUR STORY" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Our Story */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="w-16 h-1 bg-purple-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Founded in 2025 by a team of professional audio engineers and music producers,
              MIXPRESET was born from a vision to create a global platform connecting artists
              with professional mixing and mastering engineers around the world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <div className="relative w-full aspect-[16/9]"> {/* Using aspect ratio instead of min-height */}
                  <Image
                    src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                    alt="Recording studio"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">From Passion to Global Platform</h3>
              <p className="text-gray-700 mb-6">
                What started as a local network of engineers has evolved into a worldwide
                platform for mixing and mastering services. Our team has built relationships with
                top engineers in different countries, ensuring that artists can find the perfect sound
                no matter their genre or location.
              </p>
              <p className="text-gray-700">
                Today, MIXPRESET connects artists and engineers in over 40 countries,
                providing a seamless platform for collaboration, high-quality mixing and mastering services,
                and educational resources to help clients achieve their sonic vision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <div className="w-16 h-1 bg-purple-600 mx-auto mb-6"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quality First</h3>
              <p className="text-gray-700">
                We never compromise on sound quality. Every preset undergoes rigorous testing to ensure it meets our high standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ease of Use</h3>
              <p className="text-gray-700">
                We believe that powerful tools should be intuitive. Our presets are designed to deliver professional results with minimal effort.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Continuous Innovation</h3>
              <p className="text-gray-700">
                We're constantly researching new techniques and technologies to keep our presets at the cutting edge of audio production.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
            <div className="w-16 h-1 bg-purple-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Meet the experienced professionals behind MIXPRESET. Our team combines decades of industry experience with a passion for innovation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 relative">
                <Image
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                  alt="Team member"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Alex Rodriguez</h3>
              <p className="text-purple-600 mb-2">Founder & Lead Engineer</p>
              <p className="text-gray-700 text-sm">
                15+ years of experience in audio production. Previously worked with Grammy-winning artists.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 relative">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1776&q=80"
                  alt="Team member"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sarah Chen</h3>
              <p className="text-purple-600 mb-2">Sound Designer</p>
              <p className="text-gray-700 text-sm">
                Expert in electronic music production with a background in software development.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 relative">
                <Image
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1774&q=80"
                  alt="Team member"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Marcus Johnson</h3>
              <p className="text-purple-600 mb-2">Education Director</p>
              <p className="text-gray-700 text-sm">
                Former professor of audio engineering with a passion for teaching complex concepts simply.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Us CTA */}
      <div className="bg-purple-800 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join the MIXPRESET Community</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Whether you're a seasoned professional or just starting out, MIXPRESET has the tools to help you realize your sonic vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/presets" className="inline-block bg-white text-purple-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors">
              Explore Our Presets
            </a>
            <a href="/contact" className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-purple-800 transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}