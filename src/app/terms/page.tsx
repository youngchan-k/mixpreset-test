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
                  Welcome to MIXPRESET. These Terms of Service ("Terms") govern your access to and use of the MIXPRESET website, products, and services (collectively, the "Services").
                  By accessing or using the Services, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Services.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Use License</h2>
                <p>
                  You are granted a limited, non-exclusive, non-transferable, and revocable license to download, install, and use presets purchased from MIXPRESET, subject to the following conditions:
                </p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">All preset purchases include a commercial use license.</li>
                  <li className="mb-2">Redistribution, resale, or sharing of presets with third parties is strictly prohibited.</li>
                  <li className="mb-2">You may not rent, lease, loan, sell, sublicense, or otherwise transfer any rights in the presets to any third party.</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Credit System and Billing</h2>
                <p>
                  MIXPRESET operates on a credit-based model. By purchasing credit packs, you agree to pay all applicable fees.
                  Credits are non-refundable but do not expire.
                  Credits can be used to download presets according to their listed credit cost. All payments are final.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Intellectual Property</h2>
                <p>
                  All content on MIXPRESET, including but not limited to presets, courses, text, graphics, logos, icons, and software,
                  is the property of MIXPRESET or its content suppliers and is protected by international copyright and intellectual property laws.
                  No content may be copied, modified, distributed, or used for any purpose other than as expressly permitted in these Terms.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. User Accounts</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                  You agree to notify MIXPRESET immediately of any unauthorized use of your account. MIXPRESET reserves the right to suspend or terminate accounts that are suspected of unauthorized activity or violation of these Terms.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Acceptable Use</h2>
                <p>
                  You agree not to use the Services:
                </p>
                <ul className="list-disc pl-6 my-4">
                  <li className="mb-2">For any unlawful purpose or in violation of any applicable law or regulation.</li>
                  <li className="mb-2">To transmit or store any content that is abusive, defamatory, obscene, or otherwise objectionable. </li>
                  <li className="mb-2">To interfere with or disrupt the Services or servers or networks connected to the Services.</li>
                  <li className="mb-2">To access the Services through automated means, including bots or scripts, without express permission.</li>
                </ul>

                <p>
                  MIXPRESET reserves the right to remove content or suspend accounts that violate these guidelines.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Disclaimer of Warranties </h2>
                <p>
                  The Services are provided "as is" and "as available," without any warranties of any kind, either express or implied.
                  MIXPRESET does not warrant that the Services will be uninterrupted, error-free, or secure, or that any defects will be corrected.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, MIXPRESET shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of or inability to use the Services, even if advised of the possibility of such damages.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Term and Termination</h2>
                <p>
                  These Terms remain in effect until terminated by either you or MIXPRESET. You may terminate your account at any time. MIXPRESET may terminate or suspend your access to the Services at any time, with or without notice, for conduct that it believes violates these Terms or is otherwise harmful to other users or the Services.
                  Upon termination, your right to use the Services will immediately cease, and any content associated with your account may be deleted.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Changes to Terms</h2>
                <p>
                  MIXPRESET reserves the right to modify these Terms at any time. Notice of significant changes will be provided through the website or via email. Your continued use of the Services after changes become effective constitutes your acceptance of the revised Terms.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">11. Governing Law</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the jurisdiction in which MIXPRESET is established, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Services shall be resolved in the courts of that jurisdiction.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">12. Contact Information</h2>
                <p>
                  For questions or concerns regarding these Terms, please contact:
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