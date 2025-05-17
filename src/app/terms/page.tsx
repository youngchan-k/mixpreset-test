import { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Terms of Service | MIXPRESET',
  description: 'Read our terms of service for using MIXPRESET services and content.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Terms of Service"
        subtitle="Our commitment to transparency and fair usage policies"
        backgroundImage="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "LEGAL" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-blue-800/90 to-purple-700/90"
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="prose prose-lg max-w-none text-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p>
                  Welcome to MIXPRESET. These Terms of Service govern your use of our website, products, and services.
                  By accessing or using MIXPRESET, you agree to be bound by these Terms.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Use License</h2>
                <p>
                  We grant you a limited, non-exclusive, non-transferable license to download, install, and use our presets
                  subject to the following restrictions:
                </p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">All preset purchases include a commercial use license.</li>
                  <li className="mb-2">Redistribution of our presets is strictly prohibited.</li>
                  <li className="mb-2">Reselling or sharing our presets with third parties is not permitted.</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Credit System and Billing</h2>
                <p>
                  Our services operate on a credit-based model. You agree to pay for the credit packs you purchase.
                  Credits are non-refundable but do not expire. You can use your credits to download presets based on their
                  listed credit cost.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Intellectual Property</h2>
                <p>
                  All content on MIXPRESET, including but not limited to presets, courses, text, graphics, logos, icons,
                  and software, is the property of MIXPRESET or its content suppliers and is protected by international
                  copyright laws.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. User Accounts</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account information and for all activities
                  that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Disclaimer of Warranties</h2>
                <p>
                  Our services are provided "as is" without any warranties, expressed or implied. We do not guarantee that
                  our services will be error-free or uninterrupted.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Limitation of Liability</h2>
                <p>
                  MIXPRESET shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                  resulting from your use of or inability to use our services.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                  MIXPRESET is established, without regard to its conflict of law provisions.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will provide notice of significant changes
                  through our website or by sending an email to users.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us at
                  <a href="mailto:contact@mixpreset.com" className="text-purple-600 hover:text-purple-800 ml-1">contact@mixpreset.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}