'use client';

import Link from 'next/link';
import { useState } from 'react';
import HeroSection from '../HeroSection';

interface DiscordServer {
  id: string;
  name: string;
  description: string;
  memberCount: string;
  discordUrl: string;
  icon: string;
  tags: string[];
}

// Sample Discord server data
const discordServers: DiscordServer[] = [
  {
    id: 'mixpreset-official',
    name: 'MIXPRESET Official',
    description: 'Our official community server for preset sharing, feedback, and mixing discussions.',
    memberCount: '12,450+',
    discordUrl: 'https://discord.gg/example1',
    icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    tags: ['Official', 'Presets', 'Support']
  },
  {
    id: 'mixing-producers',
    name: 'Mixing & Producing',
    description: 'A collaborative space for producers and mixing engineers to share knowledge and techniques.',
    memberCount: '35,780+',
    discordUrl: 'https://discord.gg/example2',
    icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    tags: ['Production', 'Collaboration', 'Feedback']
  },
  {
    id: 'audio-engineers',
    name: 'Audio Engineers Hub',
    description: 'Professional audio engineers discussing advanced mixing and mastering techniques.',
    memberCount: '8,920+',
    discordUrl: 'https://discord.gg/example3',
    icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    tags: ['Professional', 'Advanced', 'Engineering']
  }
];

export default function CommunityContent() {
  const [activeTab, setActiveTab] = useState<'discord' | 'events' | 'contribute'>('discord');

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <HeroSection
        title="Join Our Community"
        subtitle="Connect with fellow producers, mixing engineers, and audio enthusiasts. Share knowledge, get feedback, and grow together."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "CONNECT & COLLABORATE" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
        buttons={
          <>
            <a
              href="#discord-servers"
              className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors mr-4"
            >
              Discord Servers
            </a>
            <a
              href="https://discord.gg/example1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#5865F2] text-white hover:bg-[#4752C4] px-8 py-3 rounded-full font-semibold transition-colors flex items-center"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Join Official Discord
            </a>
          </>
        }
      />

      {/* Main Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setActiveTab('discord')}
                className={`px-5 py-2.5 text-sm font-medium rounded-l-lg ${
                  activeTab === 'discord'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Discord Servers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`px-5 py-2.5 text-sm font-medium ${
                  activeTab === 'events'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border-y border-gray-300 hover:bg-gray-100'
                }`}
              >
                Community Events
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contribute')}
                className={`px-5 py-2.5 text-sm font-medium rounded-r-lg ${
                  activeTab === 'contribute'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Contribute
              </button>
            </div>
          </div>

          {/* Discord Servers */}
          {activeTab === 'discord' && (
            <div id="discord-servers">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Discord Communities</h2>
                <p className="text-xl text-gray-600">
                  Join our official Discord servers and partner communities to connect with other audio enthusiasts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {discordServers.map((server) => (
                  <div key={server.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <img src={server.icon} alt={server.name} className="h-10 w-10 mr-3" />
                        <div>
                          <h3 className="font-bold text-lg">{server.name}</h3>
                          <p className="text-gray-500 text-sm">{server.memberCount} members</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{server.description}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {server.tags.map((tag, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <a
                        href={server.discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-center py-2 rounded-md transition-colors"
                      >
                        Join Server
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Events */}
          {activeTab === 'events' && (
            <div>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Events</h2>
                <p className="text-xl text-gray-600">
                  Participate in our regular community events to learn and share with fellow audio enthusiasts.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                {/* Event 1 */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <div className="text-center md:text-left">
                        <div className="inline-block bg-purple-100 text-purple-800 text-lg font-bold rounded-lg px-4 py-2">
                          MAY 15
                        </div>
                        <p className="text-gray-500 mt-2">7:00 PM EST</p>
                      </div>
                    </div>
                    <div className="md:w-3/4">
                      <h3 className="text-xl font-bold mb-2">Mixing Workshop: Vocal Processing</h3>
                      <p className="text-gray-700 mb-4">
                        Join our expert engineers for a live workshop on advanced vocal processing techniques for modern productions.
                      </p>
                      <div className="flex items-center text-gray-500 mb-4">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Discord - MIXPRESET Official</span>
                      </div>
                      <a
                        href="https://discord.gg/example1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        RSVP Now
                      </a>
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <div className="text-center md:text-left">
                        <div className="inline-block bg-purple-100 text-purple-800 text-lg font-bold rounded-lg px-4 py-2">
                          MAY 22
                        </div>
                        <p className="text-gray-500 mt-2">2:00 PM EST</p>
                      </div>
                    </div>
                    <div className="md:w-3/4">
                      <h3 className="text-xl font-bold mb-2">Feedback Friday: Mix Critique Session</h3>
                      <p className="text-gray-700 mb-4">
                        Submit your mixes for professional feedback and learn from others in this community critique session.
                      </p>
                      <div className="flex items-center text-gray-500 mb-4">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Discord - Audio Engineers Hub</span>
                      </div>
                      <a
                        href="https://discord.gg/example3"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Submit Mix
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contribute */}
          {activeTab === 'contribute' && (
            <div>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Contribute to MIXPRESET</h2>
                <p className="text-xl text-gray-600">
                  Help grow our community by contributing your knowledge and expertise.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Submit Presets</h3>
                  <p className="text-gray-700 mb-4">
                    Share your best presets with the community. Accepted submissions earn credits and exposure.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Write Articles</h3>
                  <p className="text-gray-700 mb-4">
                    Contribute to our blog with tutorials, mixing tips, or production insights.
                  </p>
                  <a href="mailto:contribute@mixpreset.com" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                    Submit Article Idea
                  </a>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Tutorials & Courses</h3>
                  <p className="text-gray-700 mb-4">
                    Propose a tutorial or course idea. Approved educators receive revenue sharing.
                  </p>
                  <a href="mailto:education@mixpreset.com" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                    Submit Course Proposal
                  </a>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Community Moderator</h3>
                  <p className="text-gray-700 mb-4">
                    Help us grow and moderate our Discord community. Apply to become a community moderator.
                  </p>
                  <a href="https://discord.gg/example1" target="_blank" rel="noopener noreferrer" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                    Apply as Moderator
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to join our community?</h2>
            <p className="text-xl text-purple-100 mb-8">
              Connect with thousands of audio professionals and enthusiasts today.
            </p>
            <a
              href="https://discord.gg/example1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}