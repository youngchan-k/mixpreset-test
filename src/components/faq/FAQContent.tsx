'use client';

import { useState } from 'react'
import HeroSection from '../HeroSection';

interface FAQItem {
  question: string;
  answer: string;
}

function FAQContent() {
  const [expandedCategory, setExpandedCategory] = useState('general')

  // FAQ categories and questions
  const faqCategories = [
    { id: 'general', name: 'General Questions' },
    { id: 'presets', name: 'Presets & Downloads' },
    { id: 'credits', name: 'Credits & Pricing' },
    { id: 'courses', name: 'Courses & Learning' },
    { id: 'technical', name: 'Technical Support' },
    { id: 'account', name: 'Account & Billing' }
  ]

  const faqItems: Record<string, FAQItem[]> = {
    general: [
      {
        question: "What is MIXPRESET?",
        answer: "MIXPRESET is a platform that provides professional audio presets, mixing courses, and custom mixing solutions for music producers and audio engineers. Our goal is to help you achieve professional-quality sound with tools created by Grammy-winning engineers."
      },
      {
        question: "How do I get started with MIXPRESET?",
        answer: "Getting started is easy! Simply create an account, purchase credits based on your needs, and start downloading presets or enrolling in courses. If you're new to mixing, we recommend starting with our free basic tutorials."
      },
      {
        question: "Do you offer custom services?",
        answer: "Yes, we offer custom mixing services through our team of professional engineers. Visit our Custom page to browse available engineers, listen to their work samples, and contact them directly to discuss your project needs."
      },
      {
        question: "How can I contact customer support?",
        answer: "You can reach our customer support team by emailing contact@mixpreset.com. We aim to respond to all inquiries within 24 business hours."
      }
    ],
    presets: [
      {
        question: "What types of presets do you offer?",
        answer: "We offer three main categories of presets: Premium (high-quality presets for professional use), Vocal Chains (complete processing chains for vocals), and Instrument Presets (processing chains for drums, bass, guitars, etc.)."
      },
      {
        question: "Are the presets compatible with my DAW?",
        answer: "Our presets are compatible with all major DAWs including Logic Pro, FL Studio, Ableton Live, Pro Tools, and Studio One. Each preset listing specifies which DAWs it's compatible with."
      },
      {
        question: "Can I use the presets in commercial projects?",
        answer: "Yes, all credit purchases include a standard commercial license that allows you to use our presets in commercial projects. For extended commercial licensing options including distribution rights, please contact us."
      },
      {
        question: "How do I download and install presets?",
        answer: "After purchasing a preset, you can download it from your account dashboard. Each preset comes with detailed installation instructions specific to your DAW. Generally, you'll need to place the preset files in your DAW's preset folder."
      },
      {
        question: "Can I preview presets before downloading?",
        answer: "Yes, most presets include audio examples that demonstrate the before and after effect of the preset. Premium presets also include detailed descriptions of each component in the chain."
      },
      {
        question: "What type of licenses do your presets come with?",
        answer: "Yes, our presets include licenses that allow you to use them in your projects. The specific terms are detailed in our license agreement, which you can review on our licenses page. All purchases include commercial usage rights for the presets you download."
      }
    ],
    credits: [
      {
        question: "How does the credit system work?",
        answer: "Credits are our virtual currency used to download presets. You can purchase credit packs from our pricing page. Different presets cost different amounts of credits based on their complexity and value."
      },
      {
        question: "Do unused credits expire?",
        answer: "No, credits do not expire. Once purchased, they remain in your account until used."
      },
      {
        question: "Can I purchase additional credits?",
        answer: "Yes, you can purchase additional credit packages at any time. We offer different sizes of credit packs to suit your needs."
      },
      {
        question: "What's the difference between the credit packs?",
        answer: "We offer different sized credit packs to suit various needs. The Basic Credit Pack (100 credits for $14.99) is perfect for trying out our presets. The Pro Credit Pack (200 credits for $24.99) offers better value for active producers. The Ultimate Credit Pack (500 credits for $44.99) provides the best value for serious producers and studios."
      },
      {
        question: "What happens after I use all my credits?",
        answer: "Once you've used all your credits, you can purchase additional credit packs from our pricing page. Your downloaded presets will remain accessible regardless of your credit balance."
      }
    ],
    courses: [
      {
        question: "What types of courses do you offer?",
        answer: "We offer three types of courses: Basic Tutorials (free fundamentals), Premium Courses (in-depth professional techniques that require credits), and YouTube Lectures (free educational content on our YouTube channel)."
      },
      {
        question: "How long do I have access to courses?",
        answer: "Once enrolled in a course, you have lifetime access to the content. You can revisit the material as many times as you need."
      },
      {
        question: "Are the courses suitable for beginners?",
        answer: "Yes, we have courses for all skill levels. Our Basic Tutorials are specifically designed for beginners, while our Premium Courses cater to intermediate and advanced users. Each course clearly indicates the skill level it's designed for."
      },
      {
        question: "Who teaches the courses?",
        answer: "Our courses are taught by Grammy-winning engineers and producers with extensive industry experience. Each instructor specializes in specific genres and techniques, bringing real-world expertise to their teaching."
      },
      {
        question: "Can I get a certificate after completing a course?",
        answer: "Yes, upon completion of Premium Courses, you'll receive a digital certificate that you can add to your portfolio or resume."
      }
    ],
    technical: [
      {
        question: "What plugins do I need to use your presets?",
        answer: "The required plugins vary by preset and are clearly listed in each preset's description. We offer presets for stock plugins that come with your DAW as well as popular third-party plugins."
      },
      {
        question: "My preset isn't working correctly. What should I do?",
        answer: "First, ensure you have all the required plugins installed and that they're the correct versions. If you're still having issues, check our troubleshooting guide in the Help Center or contact our technical support team."
      },
      {
        question: "Can I modify the presets after downloading?",
        answer: "Absolutely! Our presets are fully customizable. In fact, we encourage you to adjust them to fit your specific needs and learn from how they're constructed."
      },
      {
        question: "Do you offer presets for specific genres?",
        answer: "Yes, we have presets optimized for various genres including Hip Hop, R&B, Pop, Rock, EDM, and Country. You can filter presets by genre on our Presets page."
      },
      {
        question: "What if I'm using an older version of my DAW?",
        answer: "We generally support the current version and up to two previous major versions of each DAW. The compatibility information is listed in each preset's description."
      }
    ],
    account: [
      {
        question: "How do I reset my password?",
        answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. We'll send you an email with instructions to create a new password."
      },
      {
        question: "How do I purchase more credits?",
        answer: "You can purchase additional credit packs from the pricing page. Simply select the credit pack that suits your needs and complete the checkout process."
      },
      {
        question: "How do I update my payment information?",
        answer: "You can update your payment information in the Billing section of your account settings. We accept all major credit cards and PayPal."
      },
      {
        question: "Is my payment information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your payment information. We never store your full credit card details on our servers."
      },
      {
        question: "Can I share my account with others?",
        answer: "Our terms of service require each user to have their own account. Sharing accounts is not permitted and may result in account suspension."
      }
    ]
  }

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(categoryId)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about MIXPRESET."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "SUPPORT & HELP" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Main Content */}
      <div className="container py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* FAQ Categories in 2x3 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {faqCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-white rounded-lg border ${expandedCategory === category.id ? 'border-purple-300 shadow-lg' : 'border-gray-200 shadow-sm'} overflow-hidden cursor-pointer transition-all`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="p-6">
                  <h2 className={`text-xl font-bold ${expandedCategory === category.id ? 'text-purple-600' : 'text-gray-800'} mb-2`}>
                    {category.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {faqItems[category.id].length} questions
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${expandedCategory === category.id ? 'text-purple-600' : 'text-gray-500'}`}>
                      {expandedCategory === category.id ? 'Currently viewing' : 'Click to view'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${expandedCategory === category.id ? 'text-purple-600' : 'text-gray-400'}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Questions for Selected Category */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden mb-12">
            <div className="bg-purple-50 p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {faqCategories.find(cat => cat.id === expandedCategory)?.name}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {faqItems[expandedCategory].map((item, index) => (
                <details key={index} className="group">
                  <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                    <span className="text-purple-600 group-open:rotate-180 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQContent;