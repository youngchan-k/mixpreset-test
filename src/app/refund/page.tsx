import { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Refund Policy | MIXPRESET',
  description: 'Learn about our refund policies for digital products at MIXPRESET.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Refund Policy"
        subtitle="Our policies regarding refunds and exchanges for digital products"
        backgroundImage="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "REFUND" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-indigo-800/90 to-purple-700/90"
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="p-8">
            <div className="prose prose-lg max-w-none text-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you for choosing MIXPRESET</h2>

              <p>
                We value your satisfaction and strive to provide high-quality digital products. Due to the nature of our products being digital goods delivered via internet download, all sales are final and non-refundable.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">No Refund Policy</h2>
              <p>
                We are unable to offer refunds or exchanges, except in cases of accidental double payments for the same product and version. Once delivered, digital goods cannot be revoked.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Exceptions</h2>
              <p>The following are the only cases where we may process a refund:</p>
              <ul className="list-disc pl-6 my-4">
                <li className="mb-2">Accidental duplicate purchase of the exact same product</li>
                <li className="mb-2">Product not delivered due to system error (after verification)</li>
                <li className="mb-2">Major defect in the product that renders it completely unusable (to be determined by our technical team)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Technical Support</h2>
              <p>
                If you are experiencing technical issues with your purchased product, please contact our customer support team before requesting a refund. Most technical issues can be resolved with proper assistance.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How to Contact Us</h2>
              <p>
                If you have any technical issues or questions, please contact our customer support at{' '}
                <a href="mailto:contact@mixpreset.com" className="text-purple-600 hover:text-purple-800">contact@mixpreset.com</a> or use the chat feature on our website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to This Policy</h2>
              <p>
                We reserve the right to modify this refund policy at any time. Changes will be effective immediately upon posting to our website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}