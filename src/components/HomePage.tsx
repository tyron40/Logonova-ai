import React from 'react';
import { Sparkles, Zap, Download, Star, ArrowRight, CheckCircle, Award, Clock, Users } from 'lucide-react';

interface HomePageProps {
  onStartGenerating: () => void;
  onViewPlans?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartGenerating, onViewPlans }) => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Advanced AI creates unique logos in seconds'
    },
    {
      icon: Download,
      title: 'Instant Download',
      description: 'Get high-quality PNG files immediately'
    },
    {
      icon: Star,
      title: 'Professional Quality',
      description: 'Business-ready logos for any industry'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Logos Created', icon: Award },
    { number: '15 sec', label: 'Average Time', icon: Clock },
    { number: '500+', label: 'Happy Users', icon: Users }
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Create Amazing
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Logos with AI
            </span>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Generate professional logos for your business in seconds. No design skills required.
          </p>
          
          {/* CTA Button */}
          <button
            onClick={onStartGenerating}
            className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 flex items-center space-x-4 mx-auto mb-12 mobile-optimized mobile-button"
          >
            <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
            <span>Create Your Logo Now</span>
            <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform duration-300" />
          </button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Choose Our Logo Generator?
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">
              Create professional logos that make your brand stand out
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 text-center hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-800/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-slate-300 text-lg">Simple steps to your perfect logo</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Enter Details', description: 'Tell us your company name and style preferences' },
              { step: '2', title: 'AI Creates', description: 'Our AI generates a unique logo just for you' },
              { step: '3', title: 'Download', description: 'Get your logo in high quality PNG format' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700"></div>
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Create Your Logo?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of businesses who trust our AI logo generator
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onStartGenerating}
              className="bg-white text-blue-600 px-12 py-4 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl mobile-optimized mobile-button"
            >
              Start Creating Now
            </button>
            
            {onViewPlans && (
              <button
                onClick={onViewPlans}
                className="bg-transparent border-2 border-white text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 mobile-optimized mobile-button"
              >
                View Pricing
              </button>
            )}
            
            <div className="flex items-center gap-2 text-blue-100">
              <CheckCircle className="w-5 h-5" />
              <span>Professional quality • Subscription plans available</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};