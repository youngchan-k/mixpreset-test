"use client"

import { FC } from 'react'
import HeroSection from '../HeroSection'

const PresetBlogPost: FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Understanding Preset: Your Ultimate Audio Mixing Solution"
        subtitle="A comprehensive guide to our platform and how it can transform your music production workflow."
        backgroundImage="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "PLATFORM GUIDE" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Main Content */}
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">What is Preset?</h2>

            <p className="text-gray-700 mb-6">
              Preset is a groundbreaking audio platform designed specifically for music producers, sound engineers, and content creators who want professional-quality mixes without the steep learning curve typically associated with audio production. Our platform combines cutting-edge AI technology with industry-standard processing techniques to deliver exceptional audio quality with just a few clicks.
            </p>

            <p className="text-gray-700 mb-6">
              At its core, Preset is built to democratize the mixing and mastering process, making professional sound quality accessible to everyone regardless of their technical expertise or budget constraints. Whether you're a bedroom producer just starting out or an experienced engineer looking to streamline your workflow, Preset provides the tools you need to achieve consistent, radio-ready results.
            </p>

            <p className="text-gray-700 mb-6">
              Our platform offers a comprehensive suite of audio processing capabilities including dynamic control, spectral balancing, spatial enhancement, and loudness optimization?all packaged in an intuitive interface that prioritizes usability without sacrificing flexibility or quality.
            </p>

            <div className="my-10 rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                alt="Mixing studio"
                className="w-full h-auto"
              />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Plugin for Mixing and Mastering Music</h2>

            <p className="text-gray-700 mb-6">
              The heart of the Preset platform is our powerful mixing and mastering plugin. This versatile tool combines multiple processing stages that would typically require a chain of different plugins, integrating them into a single, cohesive interface that delivers professional results with minimal effort.
            </p>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Key Features of Our Plugin:</h3>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li><strong>Genre-Specific Presets:</strong> Our plugin comes loaded with carefully crafted presets optimized for different genres, instruments, and production styles. These presets are designed by industry professionals and provide an excellent starting point for your mixes.</li>

              <li><strong>Adaptive Processing:</strong> Unlike standard plugins that apply the same processing regardless of the input material, our plugin analyzes your audio in real-time and adapts its processing to complement the unique characteristics of your sound.</li>

              <li><strong>Multi-Stage Processing:</strong> The plugin incorporates multiple processing stages including dynamic compression, equalization, saturation, stereo enhancement, and limiting?all working in harmony to deliver a cohesive sound.</li>

              <li><strong>Visual Feedback:</strong> Comprehensive visual feedback helps you understand exactly what's happening to your audio, making it easier to make informed decisions about your mix.</li>

              <li><strong>Parameter Control:</strong> While our presets work great out of the box, you retain full control over all parameters, allowing you to fine-tune the processing to suit your specific needs.</li>

              <li><strong>Cloud Integration:</strong> Seamlessly save and recall your settings across different sessions and devices, ensuring consistency in your workflow.</li>
            </ul>

            <p className="text-gray-700 mb-6">
              Whether you're mixing vocals, drums, full tracks, or handling the final mastering stage, our plugin provides the perfect balance between simplicity and power, enabling you to achieve professional results regardless of your experience level.
            </p>

            <div className="my-10 rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                alt="Audio plugin interface"
                className="w-full h-auto"
              />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Step-by-Step Guide: Using Preset for Mixing</h2>

            <p className="text-gray-700 mb-6">
              Getting started with Preset is straightforward, even if you're new to audio production. Follow these simple steps to transform your tracks from rough recordings to polished, professional mixes.
            </p>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Set Up Your Project</h3>

            <p className="text-gray-700 mb-6">
              Before diving into the mixing process, ensure your tracks are properly organized and prepared:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Import your audio tracks into your Digital Audio Workstation (DAW)</li>
              <li>Organize tracks by instrument or section (drums, bass, guitars, vocals, etc.)</li>
              <li>Ensure all tracks are properly labeled for easy identification</li>
              <li>Check for any technical issues like clipping or phase problems</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Add the Preset Plugin</h3>

            <p className="text-gray-700 mb-6">
              Once your project is organized, it's time to add our plugin to your tracks:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Navigate to the plugin section in your DAW</li>
              <li>Select "Preset" from your available plugins</li>
              <li>Add the plugin to individual tracks, groups, or the master bus depending on your workflow</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Select a Starting Preset</h3>

            <p className="text-gray-700 mb-6">
              Choose from our library of professionally designed presets as your starting point:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Click on the preset browser within the plugin</li>
              <li>Browse presets by instrument type (vocals, drums, bass, etc.)</li>
              <li>Filter presets by genre to find options tailored to your music style</li>
              <li>Preview presets to hear how they affect your audio</li>
              <li>Select the preset that best complements your track</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Customize Your Settings</h3>

            <p className="text-gray-700 mb-6">
              While our presets sound great out of the box, you can fine-tune them to perfectly match your vision:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Adjust the input gain to ensure optimal signal level</li>
              <li>Modify dynamics settings to control compression amount and character</li>
              <li>Fine-tune EQ settings to shape the tonal balance</li>
              <li>Adjust saturation to add warmth and character as needed</li>
              <li>Set spatial controls to position elements in the stereo field</li>
              <li>Adjust the output level for proper gain staging</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">5. Save and Share Your Settings</h3>

            <p className="text-gray-700 mb-6">
              Once you've dialed in the perfect sound, save your settings for future use:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Click the save button within the plugin interface</li>
              <li>Name your custom preset and add relevant tags</li>
              <li>Choose whether to save locally or to your Preset cloud account</li>
              <li>Optionally share your custom preset with the Preset community</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">6. Apply to Your Full Mix</h3>

            <p className="text-gray-700 mb-6">
              For a cohesive sound across your entire project:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
              <li>Process individual tracks with instrument-specific presets</li>
              <li>Use group processing for related instruments (drum bus, backing vocals, etc.)</li>
              <li>Apply a mastering preset to your master bus for final polishing</li>
              <li>Make subtle adjustments to ensure all elements work together harmoniously</li>
            </ul>

            <div className="my-10 rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
                alt="Mixing process"
                className="w-full h-auto"
              />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Conclusion</h2>

            <p className="text-gray-700 mb-6">
              Preset transforms the complex art of mixing and mastering into an accessible, intuitive process that delivers professional results regardless of your experience level. By combining powerful processing capabilities with an intuitive interface and expertly crafted presets, we've created a tool that helps you achieve your sonic vision without getting lost in technical complexities.
            </p>

            <p className="text-gray-700 mb-6">
              Whether you're producing your first track or your fiftieth, Preset provides the perfect balance of simplicity and power to help you create mixes that sound polished, balanced, and ready for the world to hear. Start your journey with Preset today and experience the difference that intelligent, adaptive processing can make in your productions.
            </p>

            <p className="text-gray-700 mb-6">
              Ready to transform your sound? Sign up for Preset now and join thousands of producers who are already creating professional-quality mixes with our platform.
            </p>

            <div className="mt-10 flex justify-center">
              <button className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-purple-700 transition-colors">
                Try Preset Today
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

export default PresetBlogPost