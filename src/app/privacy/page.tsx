import { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Privacy Policy | MIXPRESET',
  description: 'Learn about how we collect, use, and protect your personal information at MIXPRESET.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information"
        backgroundImage="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "DATA PROTECTION" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-indigo-800/90 to-purple-700/90"
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
                  At MIXPRESET, we respect your privacy and are committed to protecting your personal data.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                  when you visit our website or use our services.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Information We Collect</h2>
                <p>We may collect the following types of information:</p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2"><strong>Personal Information:</strong> Name, email address, billing information, and other contact details you provide when creating an account or making a purchase.</li>
                  <li className="mb-2"><strong>Usage Data:</strong> Information about how you interact with our website, such as pages visited, time spent on pages, and actions taken.</li>
                  <li className="mb-2"><strong>Device Information:</strong> Information about your device, including IP address, browser type, operating system, and device identifiers.</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">Provide, maintain, and improve our services</li>
                  <li className="mb-2">Process transactions and send related information</li>
                  <li className="mb-2">Send administrative notifications, such as updates to our terms or privacy policy</li>
                  <li className="mb-2">Respond to your comments, questions, and requests</li>
                  <li className="mb-2">Personalize your experience and deliver content relevant to your interests</li>
                  <li className="mb-2">Monitor and analyze trends, usage, and activities in connection with our services</li>
                  <li className="mb-2">Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Sharing Your Information</h2>
                <p>
                  We may share your information with third parties in the following circumstances:
                </p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">With service providers who perform services on our behalf</li>
                  <li className="mb-2">To comply with legal obligations</li>
                  <li className="mb-2">To protect and defend our rights and property</li>
                  <li className="mb-2">With your consent or at your direction</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect the security of your personal information.
                  However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee
                  absolute security.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Your Data Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, including:
                </p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">The right to access your personal information</li>
                  <li className="mb-2">The right to correct inaccurate or incomplete information</li>
                  <li className="mb-2">The right to request deletion of your personal information</li>
                  <li className="mb-2">The right to restrict or object to processing of your personal information</li>
                  <li className="mb-2">The right to data portability</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar tracking technologies to collect information about your browsing activities.
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Children's Privacy</h2>
                <p>
                  Our services are not intended for individuals under the age of 16. We do not knowingly collect personal
                  information from children under 16. If we learn we have collected personal information from a child under 16,
                  we will delete that information.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                  Privacy Policy on this page and updating the "Last updated" date.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Contact Us</h2>
                <p>
                  If you have questions or concerns about this Privacy Policy, please contact us at
                  <a href="mailto:privacy@mixpreset.com" className="text-purple-600 hover:text-purple-800 ml-1">privacy@mixpreset.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}