import { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Licenses | MIXPRESET',
  description: 'Information about MIXPRESET licenses and how they can be used.',
};

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Licenses"
        subtitle="Understand how you can use our presets and content"
        backgroundImage="https://images.unsplash.com/photo-1620120966883-d977b57a96ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "LICENSE TERMS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-gray-800/90 to-purple-800/90"
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">License Types</h2>
              <p className="text-lg text-gray-700 mb-8">
                MIXPRESET offers different license types depending on your needs. Each license grants different usage rights
                for our presets and content.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Standard Commercial License</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Use in personal projects
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited personal use
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lifetime access to purchased presets
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Commercial client work
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reselling or distribution
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500">
                    Included with: <span className="font-semibold">All Credit Purchases</span>
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Extended Commercial License</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All Standard features
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      White-label rights
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Distribution rights (with restrictions)
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Custom terms available
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500">
                    <span className="font-semibold">Contact us for pricing and details</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">License FAQ</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Can I use MIXPRESET presets in my commercial music?</h3>
                  <p className="text-gray-700">
                    Yes, both Professional and Enterprise licenses allow you to use our presets in commercial music releases
                    without any additional fees or royalties.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Can I use presets for client work?</h3>
                  <p className="text-gray-700">
                    Professional and Enterprise licenses allow you to use our presets for client work. The Personal license
                    does not permit usage in commercial client projects.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Can I share or resell presets?</h3>
                  <p className="text-gray-700">
                    No. None of our standard licenses permit sharing or reselling presets. Presets cannot be distributed as
                    part of other preset collections, sample packs, or similar products without a specific Commercial license
                    agreement.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Do I need to credit MIXPRESET when using presets?</h3>
                  <p className="text-gray-700">
                    No, you're not required to credit MIXPRESET when using our presets in your productions. However, we always
                    appreciate when users mention us!
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Do my purchased presets ever expire?</h3>
                  <p className="text-gray-700">
                    No, once you purchase a preset with your credits, you have lifetime access to those presets. Your credits also never expire, so you can use them to purchase presets whenever you want.
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about our licensing terms or need a custom licensing solution, please contact
                  our licensing team at <a href="mailto:licensing@mixpreset.com" className="text-purple-600 hover:text-purple-800">licensing@mixpreset.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}