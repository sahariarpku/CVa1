
import React, { useState, useEffect } from 'react';

import { View, Job, CVProfile } from '../types';
import { auth, db } from '../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cvService } from '../services/cvService';
import { matchingService } from '../services/matchingService';
import { aiService } from '../services/aiService';
import { settingsService } from '../services/settingsService';

interface DiscoverViewProps {
  navigate: (view: View) => void;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ navigate }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);



  // ... (inside component)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Get Profile
        let userProfile: CVProfile | null = null;
        const local = localStorage.getItem('cv_profile_local');
        if (local) {
          userProfile = JSON.parse(local);
        } else if (auth.currentUser) {
          userProfile = await cvService.getProfile(auth.currentUser.uid);
        }

        // 2. Get Settings & Jobs
        // Fetch Settings for Keywords
        let query = 'research';
        if (auth.currentUser) {
          const settings = await settingsService.getSettings(auth.currentUser.uid);
          if (settings?.jobPreferences?.keywords) {
            query = settings.jobPreferences.keywords;
          }
        }

        console.log("DiscoverView: Searching for", query);
        const res = await fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data = await res.json();
        let fetchedJobs: Job[] = data.jobs || [];

        // 3. Match & Sort (Hybrid: Fast static sort first, then AI if active)
        if (userProfile && fetchedJobs.length > 0) {
          // Initial static sort to put best candidates on top
          fetchedJobs = fetchedJobs.map(job => ({
            ...job,
            matchScore: matchingService.calculateMatchScore(userProfile!, job)
          })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
        fetchedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        setJobs(fetchedJobs);
        setIsLoading(false); // Enable UI immediately

        // OPTIONAL: Enhance top 3 with AI in background
        const topJobs = fetchedJobs.slice(0, 3);
        const controller = new AbortController();

        // We don't await this, so UI is interactive
        Promise.all(topJobs.map(async (job) => {
          if (controller.signal.aborted) return;
          const aiResult = await aiService.calculateJobMatch(job, userProfile!, controller.signal);
          if (aiResult.score > 0) {
            // Update state safely
            setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? {
              ...j,
              matchScore: aiResult.score,
              matchReason: aiResult.reason,
              missingSkills: aiResult.missing_skills
            } : j));
          }
        })).catch(err => {
          if (err.name !== 'AbortError') console.error("Background AI Error", err);
        });

        return () => controller.abort(); // Cleanup on effect re-run/unmount

      } catch (err) {
        console.error("Discover load error", err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentJob = jobs[currentIndex];

  // ... (imports remain)

  const handleNext = async (save: boolean) => {
    console.log("=== HANDLE NEXT TRIGGERED ===");
    console.log("Save:", save);
    console.log("Current User:", auth.currentUser?.uid);
    console.log("Current Job:", currentJob ? { id: currentJob.id, title: currentJob.title } : null);

    if (save && currentJob && auth.currentUser) {
      try {
        console.log("Attempting to save job to Firestore...");
        const docRef = await addDoc(collection(db, 'applications'), {
          userId: auth.currentUser.uid,
          jobId: currentJob.id,
          // Map fields for TrackerView
          title: currentJob.title,
          employer: currentJob.employer || currentJob.institution,
          location: currentJob.location,
          link: currentJob.link,
          deadline: currentJob.deadline,
          raw_data: currentJob,

          status: 'Saved',
          userNotes: '',
          dateApplied: null,
          created_at: new Date().toISOString() // Match sort key
        });
        console.log("✅ Job Saved Successfully! Doc ID:", docRef.id, "Title:", currentJob.title);
      } catch (e) {
        console.error("❌ Error saving job:", e);
      }
    } else if (save && !auth.currentUser) {
      console.error("❌ Cannot save: No authenticated user");
    } else if (save && !currentJob) {
      console.error("❌ Cannot save: No current job");
    }
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or show end card? For now just reset or stay
      alert("No more jobs!");
    }
  };

  // ...

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f1115] text-slate-900 dark:text-white font-sans h-full">

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <div className="max-w-[700px] w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3 p-4 bg-white dark:bg-[#192233] rounded-xl shadow-sm border border-slate-100 dark:border-[#232f48]">
            <div className="flex gap-6 justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <p className="text-slate-900 dark:text-white text-base font-semibold leading-normal">AI Match Relevance</p>
              </div>
              <p className="text-primary text-lg font-bold leading-normal">{currentJob?.matchScore || 0}%</p>
            </div>
            <div className="rounded-full bg-slate-200 dark:bg-[#324467] h-3">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${currentJob?.matchScore || 0}%` }}></div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-slate-500 dark:text-[#92a4c9] text-xs font-medium uppercase tracking-wider">Analysis</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{currentJob?.matchReason || 'Calculating match...'}"</p>
              {currentJob?.missingSkills && currentJob.missingSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentJob.missingSkills.map(s => (
                    <span key={s} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase">Missing: {s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full aspect-[16/11]">
            <div className="absolute inset-0 translate-y-3 scale-[0.97] bg-slate-300 dark:bg-[#232f48] rounded-2xl opacity-50 z-0"></div>
            <div className="absolute inset-0 translate-y-1.5 scale-[0.985] bg-slate-200 dark:bg-[#1e293b] rounded-2xl opacity-80 z-10"></div>

            <div className="absolute inset-0 z-20 bg-white dark:bg-[#192233] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-100 dark:border-[#232f48]">
              <div
                className="w-full h-32 bg-center bg-no-repeat bg-cover relative bg-slate-100 shrink-0"
                style={{ backgroundImage: currentJob?.imageUrl ? `url("${currentJob.imageUrl}")` : undefined }}
              >
                {!currentJob?.imageUrl && <div className="absolute inset-0 flex items-center justify-center text-slate-400">No Image</div>}
                <div className="absolute top-4 left-4 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm uppercase">
                  New Listing
                </div>
              </div>

              <div className="flex-1 p-5 flex flex-col justify-between min-h-0">
                <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                  <div>
                    <p className="text-primary text-xs font-bold uppercase tracking-widest mb-0.5 text-ellipsis overflow-hidden whitespace-nowrap">{currentJob?.department || currentJob?.source || 'General'}</p>
                    <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight line-clamp-2">{currentJob?.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-600 dark:text-[#92a4c9]">
                      <span className="material-symbols-outlined text-sm">account_balance</span>
                      <p className="text-sm font-medium line-clamp-1">{currentJob?.institution || currentJob?.employer}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-100 dark:border-[#232f48]">
                    <div className="flex flex-col">
                      <p className="text-slate-400 dark:text-[#92a4c9] text-[10px] font-medium uppercase">Salary</p>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{currentJob?.salary || 'Competitive'}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-400 dark:text-[#92a4c9] text-[10px] font-medium uppercase">Deadline</p>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{currentJob?.deadline || 'Open'}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-400 dark:text-[#92a4c9] text-[10px] font-medium uppercase">Type</p>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{currentJob?.type || 'Full-time'}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-400 dark:text-[#92a4c9] text-[10px] font-medium uppercase">Location</p>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{currentJob?.location || 'Remote'}</p>
                    </div>
                  </div>
                </div>

                <a
                  href={currentJob?.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold text-sm shrink-0"
                >
                  <span>View Full Details</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-4">
            <div className="flex items-center gap-12">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleNext(false)}
                  className="size-16 flex items-center justify-center rounded-full bg-slate-200 dark:bg-[#232f48] text-slate-400 dark:text-[#92a4c9] hover:bg-red-500 hover:text-white transition-all shadow-lg group"
                >
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">close</span>
                </button>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discard</span>
              </div>



              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleNext(true)}
                  className="size-16 flex items-center justify-center rounded-full bg-primary text-white hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 group"
                >
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">favorite</span>
                </button>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Save Job</span>
              </div>
            </div>

            <div className="bg-primary/10 dark:bg-primary/5 px-6 py-2 rounded-full border border-primary/20">
              <p className="text-primary text-sm font-medium leading-normal flex items-center gap-3">
                <span className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#192233] border border-primary/30 text-[10px]">←</kbd>
                  <span className="text-[10px] self-center">Discard</span>
                </span>
                <span className="text-primary/30">|</span>
                <span className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#192233] border border-primary/30 text-[10px]">→</kbd>
                  <span className="text-[10px] self-center">Save</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 px-10 border-t border-slate-100 dark:border-[#232f48] mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-slate-500 dark:text-[#92a4c9]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span className="text-xs">428 seen today</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">bookmark</span>
              <span className="text-xs">12 saved for review</span>
            </div>
          </div>
          <div className="text-slate-400 dark:text-[#92a4c9] text-xs font-medium">
            © 2023 AcademiaAI Research Networks. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DiscoverView;
