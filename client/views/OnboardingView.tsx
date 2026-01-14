
import React from 'react';

import { View } from '../types';

interface OnboardingViewProps {
  navigate: (view: View) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ navigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-[960px] w-full flex flex-col gap-12">
          <div className="flex flex-col gap-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                <span className="text-primary text-xs font-bold uppercase tracking-widest">AI-Powered Onboarding</span>
              </div>
            </div>
            <h1 className="text-gray-900 dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">
              How would you like to build your profile?
            </h1>
            <p className="text-gray-600 dark:text-[#92a4c9] text-lg max-w-2xl mx-auto">
              Our AI will help you tailor your academic presence for the perfect match.
              Choose the method that works best for your career stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group flex flex-col p-8 rounded-xl bg-white dark:bg-[#1a2130] border border-gray-200 dark:border-[#232f48] transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/5">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#232f48] text-gray-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-4xl">upload_file</span>
              </div>
              <h3 className="text-gray-900 dark:text-white text-2xl font-bold mb-3">Upload Existing CV</h3>
              <p className="text-gray-600 dark:text-[#92a4c9] text-base mb-6 leading-relaxed">
                Import your current PDF or Word doc. Our AI will parse your research, publications, and teaching experience automatically.
              </p>
              <div className="mt-auto">
                <span className="inline-block px-3 py-1 rounded-md bg-gray-100 dark:bg-background-dark text-[#92a4c9] text-xs font-medium mb-6">
                  Recommended for established researchers
                </span>
                <button
                  onClick={() => navigate(View.TRACKER)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-gray-200 dark:bg-[#232f48] text-gray-900 dark:text-white font-bold hover:bg-gray-300 dark:hover:bg-[#2d3a5a] transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">cloud_upload</span>
                  Upload File
                </button>
              </div>
            </div>

            <div className="group flex flex-col p-8 rounded-xl bg-white dark:bg-[#1a2130] border border-primary/40 dark:border-primary/30 ring-2 ring-primary/20 transition-all duration-300 cursor-pointer hover:bg-primary/5">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-4xl">edit_note</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-gray-900 dark:text-white text-2xl font-bold">Create New CV</h3>
                <span className="px-2 py-0.5 bg-primary text-[10px] font-bold text-white rounded uppercase tracking-tighter">Popular</span>
              </div>
              <p className="text-gray-600 dark:text-[#92a4c9] text-base mb-6 leading-relaxed">
                Don't have a CV ready? Build an academic-grade profile from scratch with guided AI prompts tailored for your field.
              </p>
              <div className="mt-auto">
                <span className="inline-block px-3 py-1 rounded-md bg-primary/5 dark:bg-primary/10 text-primary text-xs font-medium mb-6">
                  Best for early career academics
                </span>
                <button
                  onClick={() => navigate(View.CV_BUILDER)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-primary text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-xl">magic_button</span>
                  Start Building Now
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              onClick={() => navigate(View.DISCOVER)}
              className="text-gray-500 dark:text-[#92a4c9] text-sm font-medium hover:text-primary transition-colors underline decoration-2 underline-offset-4"
            >
              Not ready yet? Skip to browse jobs for now
            </button>
            <div className="flex items-center gap-4 text-gray-400 text-xs">
              <div className="flex gap-1">
                <div className="w-8 h-1 rounded-full bg-primary"></div>
                <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-[#232f48]"></div>
                <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-[#232f48]"></div>
              </div>
              <span>Step 1 of 3</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingView;
