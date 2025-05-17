"use client"

import { useState, FormEvent } from 'react'
import HeroSection from '../HeroSection'

function BlogContent() {
  // State for category filter
  const [activeCategory, setActiveCategory] = useState('All')

  // Mock blog posts data
  const blogPosts = [
    {
      id: 0,
      title: "Understanding Preset: Your Ultimate Audio Mixing Solution",
      excerpt: "A comprehensive guide to our platform and how it can transform your music production workflow. Learn about our plugin and follow our step-by-step mixing guide.",
      date: "April 8, 2024",
      author: "Preset Team",
      category: "Platform Guide",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      link: "/blog/preset-guide"
    },
    {
      id: 1,
      title: "5 Essential Vocal Processing Techniques for Modern Productions",
      excerpt: "Learn the key techniques used by professional engineers to achieve clean, powerful vocals that cut through any mix.",
      date: "March 15, 2025",
      author: "Alex Johnson",
      category: "Mixing Tips",
      image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      id: 2,
      title: "Understanding Compression: The Complete Guide",
      excerpt: "Demystifying one of the most powerful yet misunderstood tools in audio production with practical examples and settings.",
      date: "March 10, 2025",
      author: "Sarah Williams",
      category: "Audio Basics",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      id: 3,
      title: "Creating Space in Your Mix with Reverb and Delay",
      excerpt: "Discover how to use spatial effects to create depth and dimension in your productions without causing mud or phase issues.",
      date: "March 5, 2025",
      author: "Michael Rodriguez",
      category: "Mixing Tips",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80"
    },
    {
      id: 4,
      title: "The Art of Mastering: From Good to Great",
      excerpt: "Learn the essential steps and tools needed to take your mixes from good to radio-ready with professional mastering techniques.",
      date: "February 28, 2025",
      author: "Emily Chen",
      category: "Mastering",
      image: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      id: 5,
      title: "Mixing for Different Genres: Hip Hop vs. Rock",
      excerpt: "Explore the key differences in approach when mixing different genres, with specific techniques for hip hop and rock productions.",
      date: "February 20, 2025",
      author: "David Thompson",
      category: "Genre Specific",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    },
    {
      id: 6,
      title: "Setting Up Your Home Studio for Optimal Sound",
      excerpt: "A comprehensive guide to acoustic treatment, monitor placement, and room calibration for the best possible sound in your home studio.",
      date: "February 15, 2025",
      author: "Olivia Martinez",
      category: "Studio Setup",
      image: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
    }
  ]

  // Categories for filter
  const categories = ["All", "Platform Guide", "Mixing Tips", "Audio Basics", "Mastering", "Genre Specific", "Studio Setup"]

  // Filter posts based on selected category
  const filteredPosts = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter(post => post.category === activeCategory)

  // Handle newsletter signup
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert(`Thank you for subscribing with: ${email}`)
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Blog"
        subtitle="Insights, tutorials, and news from the world of audio production."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "AUDIO INSIGHTS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Main Content */}
      <div className="container py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors border ${
                  category === activeCategory
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <div className="mb-16">
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <img
                src={filteredPosts[0].image}
                alt={filteredPosts[0].title}
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {filteredPosts[0].category}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{filteredPosts[0].title}</h2>
                <p className="text-gray-200 text-lg mb-4">{filteredPosts[0].excerpt}</p>
                <div className="flex items-center text-gray-300 text-sm">
                  <span>{filteredPosts[0].date}</span>
                  <span className="mx-2">?</span>
                  <span>By {filteredPosts[0].author}</span>
                </div>
                <a href={filteredPosts[0].link || "#"} className="inline-block mt-4 bg-white text-purple-600 px-6 py-2 rounded-full hover:bg-gray-100 transition-colors">
                  Read More
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredPosts.slice(1).map(post => (
            <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-purple-500/20 transition-shadow">
              <div className="h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium mb-3">
                  {post.category}
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <span>{post.date}</span>
                  <span className="mx-2">?</span>
                  <span>By {post.author}</span>
                </div>
                <a href={post.link || "#"} className="text-purple-600 font-medium hover:text-purple-800 transition-colors">
                  Read More
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-purple-50 rounded-lg p-8 border border-purple-100 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-gray-600 mb-6">
              Get the latest mixing tips, tutorials, and product updates delivered straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <button className="relative inline-flex items-center px-4 py-2 rounded-l-md border bg-gray-100 text-gray-400 cursor-not-allowed text-sm font-medium">
              Previous
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border bg-purple-600 text-white border-purple-600 text-sm font-medium">
              1
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
              2
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
              3
            </button>
            <button className="relative inline-flex items-center px-4 py-2 rounded-r-md border bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default BlogContent