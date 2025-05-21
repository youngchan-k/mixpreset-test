'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  imageDarken?: boolean;
  customGradient?: string;
  buttons?: ReactNode;
  badge?: {
    text: string;
    color?: string;
  };
  stats?: {
    label: string;
    value: string;
    startValue?: string;
  }[];
  showWaveAnimation?: boolean;
  showSocialProof?: boolean;
  socialProofText?: string;
  height?: 'small' | 'medium' | 'large';
  titleGradient?: boolean;
  shape?: 'curved' | 'wave' | 'angle' | 'none';
  children?: ReactNode;
  centered?: boolean;
  parallax?: boolean;
  animatedText?: boolean;
}

const HeroSection = ({
  title,
  subtitle,
  backgroundImage = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  imageDarken = true,
  customGradient,
  buttons,
  badge,
  stats = [],
  showWaveAnimation = false,
  showSocialProof = false,
  socialProofText = 'Trusted by professionals at Sony, Universal, and Warner Music worldwide',
  height = 'medium',
  titleGradient = false,
  shape = 'wave',
  children,
  centered = true,
  parallax = false,
  animatedText = false,
}: HeroSectionProps) => {
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState<{[key: number]: string}>({});

  // Set the height based on prop - make consistent across all pages
  const heightClasses = {
    small: 'py-16 md:py-24',
    medium: 'py-24 md:py-32',
    large: 'py-28 md:py-40',
  };

  // Add padding bottom when using shapes to avoid overlap
  const getShapePadding = () => {
    if (shape === 'none') return '';
    return 'pb-16'; // Add extra padding at bottom when using shapes
  };

  // Handle parallax effect
  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      setOffset(window.scrollY * 0.3);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [parallax]);

  // Handle entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle stats counter animation
  useEffect(() => {
    if (!isVisible || stats.length === 0) return;

    const animationDuration = 2000; // 2 seconds
    const frameDuration = 16; // ~60fps
    const frames = animationDuration / frameDuration;

    let frame = 0;
    const initialStats: {[key: number]: string} = {};

    // Animation interval
    const timer = setInterval(() => {
      const newAnimatedStats: {[key: number]: string} = {};

      stats.forEach((stat, index) => {
        // Parse the numeric part of the value
        const targetValue = stat.value.match(/(\d+)/)?.[0] || '0';
        const targetNumber = parseInt(targetValue, 10);

        // Get suffix like "+" or "k+"
        const suffix = stat.value.match(/\d+(.*)/)?.[1] || '';

        // Calculate the current value based on animation progress
        const progress = Math.min(frame / frames, 1);
        const currentNumber = Math.floor(targetNumber * progress);

        // Special handling for rating (like 4.9/5)
        if (stat.value.includes('/')) {
          const [targetRating, maxRating] = stat.value.split('/');
          const targetRatingNum = parseFloat(targetRating);
          const currentRating = (targetRatingNum * progress).toFixed(1);
          newAnimatedStats[index] = `${currentRating}/${maxRating}`;
        } else {
          // Regular number with possible suffix
          newAnimatedStats[index] = `${currentNumber}${suffix}`;
        }
      });

      setAnimatedStats(newAnimatedStats);

      frame++;
      if (frame > frames) {
        clearInterval(timer);

        // Set final values
        const finalStats: {[key: number]: string} = {};
        stats.forEach((stat, index) => {
          finalStats[index] = stat.value;
        });
        setAnimatedStats(finalStats);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [isVisible, stats]);

  // Set the shape based on prop
  const getShape = () => {
    switch (shape) {
      case 'curved':
        return (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-white rounded-t-[50px]"></div>
        );
      case 'wave':
        return (
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto fill-white">
              <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
            </svg>
          </div>
        );
      case 'angle':
        return (
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto fill-white">
              <path d="M0,0L1440,120L1440,120L0,120Z"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Split title for animated text
  const titleWords = title.split(' ');

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient overlay */}
      <div
        className={`absolute inset-0 z-10 ${
          customGradient || 'bg-gradient-to-r from-purple-600/90 to-purple-800/90'
        }`}
      ></div>

      {/* Background image with next/image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          priority
          quality={85}
          sizes="100vw"
          className={`object-cover object-center ${imageDarken ? 'opacity-90' : 'opacity-100'} transition-opacity duration-500`}
          style={parallax ? { transform: `translateY(${offset}px)` } : undefined}
        />
      </div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 z-[9] opacity-10 bg-[url('/noise-pattern.png')] bg-repeat"></div>

      {/* Animated waveform overlay */}
      {showWaveAnimation && (
        <div
          className="absolute inset-0 z-[11] opacity-20 bg-center bg-repeat-x bg-[length:1000px_100%] animate-pulse"
          style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI2MHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTAgNTEuNzZjMzYuMjEtMi4yNSA3Ny41Ny0zLjU4IDEyNi40Mi0zLjU4IDMyMCAwIDMyMCA1NyA2NDAgNTcgMjcxLjE1IDAgMzEyLjU4LTQwLjkxIDUxMy41OC01Ny40VjE0MEgweiIgZmlsbC1vcGFjaXR5PSIuNSIvPjxwYXRoIGQ9Ik0wIDI0LjMxYzQzLjEtNS41IDk2LjM2LTkuNTIgMTU1LjY5LTkuNTIgMzIwIDAgMzIwIDg5LjI0IDY0MCA4OS4yNCAyNTYuMTMgMCAzMDcuMjgtNTcuMTYgNDg0LjMxLTgwVjE0MEgweiIgZmlsbC1vcGFjaXR5PSIuMyIvPjxwYXRoIGQ9Ik0wIDEyMS44YzM2LjIxLTIuMjUgNzcuNTctMy41OCAxMjYuNDItMy41OCAzMjAgMCAzMjAgNTcgNjQwIDU3IDI3MS4xNSAwIDMxMi41OC00MC45MSA1MTMuNTgtNTcuNFYxNDBIMHoiLz48L2c+PC9zdmc+')"
          }}
        ></div>
      )}

      {/* Content */}
      <div className={`relative z-20 container ${heightClasses[height]} ${getShapePadding()} flex items-center`}>
        <div className={`w-full ${centered ? 'max-w-5xl mx-auto text-center' : 'max-w-4xl'} relative`}>
          {/* Animated entry */}
          <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Decorative element */}
            <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full opacity-70"></div>

            {/* Badge */}
            {badge && (
              <div className={`inline-block px-5 py-1.5 ${badge.color || 'bg-white/20'} backdrop-blur-md rounded-full text-white text-sm font-semibold mb-3 sm:mb-4 mt-4 sm:mt-6 md:mt-8 border border-white/20 shadow-lg animate-fadeIn`}>
                {badge.text}
              </div>
            )}

            {/* Title with options for animation and gradient */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {animatedText ? (
                <div>
                  {titleWords.map((word, index) => (
                    <span
                      key={index}
                      className={`inline-block transition-all duration-700 delay-${index * 100} transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                      {titleGradient && index === 1 ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 px-1">{word}</span>
                      ) : (
                        <span className="px-1">{word}</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : titleGradient ? (
                <div>
                  {titleWords.map((word, i) =>
                    i === 1 ? (
                      <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 px-0.5">{word} </span>
                    ) : (
                      <span key={i} className="px-0.5">{word} </span>
                    )
                  )}
                </div>
              ) : (
                title
              )}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className={`text-sm sm:text-base md:text-lg text-purple-100 mb-6 sm:mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-200 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {subtitle}
              </p>
            )}

            {/* Stats display - Removed box and added animation */}
            {stats.length > 0 && (
              <div className={`flex flex-wrap justify-center gap-8 sm:gap-10 md:gap-16 mb-8 sm:mb-10 text-white transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      {animatedStats[index] || '0'}
                    </div>
                    <div className="text-sm sm:text-base text-purple-200 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            {buttons && (
              <div className={`flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 transition-all duration-1000 delay-400 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {buttons}
              </div>
            )}

            {/* Children (custom content) */}
            <div className={`transition-all duration-1000 delay-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {children}
            </div>

            {/* Social proof */}
            {showSocialProof && (
              <div className={`mt-8 sm:mt-10 md:mt-12 text-white/80 text-xs sm:text-sm px-4 sm:px-0 transition-all duration-1000 delay-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {socialProofText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shape divider */}
      {getShape()}

      {/* Floating elements - decorative */}
      <div className="absolute top-1/4 left-10 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default HeroSection;