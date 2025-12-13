
import React, { useState, useEffect } from 'react';
import { Github, Star, X, ExternalLink, Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface WelcomeModalProps {
  language: Language;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ language }) => {
  const t = TRANSLATIONS[language].welcome;
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Version key to show welcome screen again if major updates happen
  const WELCOME_KEY = 'research_assistant_welcome_v1';

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_KEY);
    if (!hasSeenWelcome) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem(WELCOME_KEY, 'true');
    setTimeout(() => {
      setIsVisible(false);
    }, 300); // Match transition duration
  };

  const handleGitHubClick = () => {
    window.open('https://github.com', '_blank'); // Replace with actual repo URL
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className={`
        relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all duration-500
        ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}
      `}>
        
        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10 dark:opacity-20"></div>
        <div className="absolute top-0 right-0 p-4 z-10">
            <button onClick={handleClose} className="p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-black/40 transition-colors text-slate-500 dark:text-slate-300">
                <X size={20} />
            </button>
        </div>

        <div className="relative p-8 pt-10 text-center flex flex-col items-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center mb-6 transform -rotate-6 ring-4 ring-white dark:ring-slate-700">
                <Sparkles size={40} className="text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2">
                {t.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                {t.subtitle}
            </p>

            {/* Main Content Box */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 w-full border border-slate-100 dark:border-slate-700 mb-6">
                <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    {t.opensource}
                </p>

                <button 
                    onClick={handleGitHubClick}
                    className="w-full group bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                    <Github size={20} />
                    {t.githubBtn}
                    <ExternalLink size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <Star size={16} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                    <span>{t.starSupport}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center gap-4 w-full">
                <button 
                    onClick={handleClose}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-bold transition-colors"
                >
                    {t.close}
                </button>
                
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck size={12} />
                    {t.license}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
