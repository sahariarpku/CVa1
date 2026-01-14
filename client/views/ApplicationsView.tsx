import React from 'react';
import { View } from '../types';
import { db, auth } from '../src/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { aiService } from '../services/aiService';
import { cvService } from '../services/cvService';
import GeneratedContentModal from '../components/GeneratedContentModal';

// Firestore integration for real-time updates

interface ApplicationsViewProps {
  navigate: (view: View) => void;
}



// ...

const ApplicationsView: React.FC<ApplicationsViewProps> = ({ navigate }) => {
  const [savedJobs, setSavedJobs] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "applications"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
        // Filter out jobs that are already applied/submitted
        .filter((job: any) => job.status === 'Saved')
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setSavedJobs(jobs);
    }, (error) => {
      console.error("Failed to fetch saved jobs", error);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const markAsApplied = async (jobId: string) => {
    try {
      const jobRef = doc(db, "applications", jobId);
      await updateDoc(jobRef, {
        status: 'Submitted', // Or 'Applied' depending on your schema choice
        applied_at: new Date().toISOString()
      });
      // The snapshot listener will automatically remove it from the list because of the filter
      alert("Job marked as applied and moved to Tracker!");
    } catch (error) {
      console.error("Error marking job as applied:", error);
      alert("Failed to update status.");
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to dismiss this job?")) return;
    try {
      await deleteDoc(doc(db, "applications", jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job.");
    }
  };

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalType, setModalType] = React.useState<'cv' | 'cover-letter'>('cv');
  const [activeJobTitle, setActiveJobTitle] = React.useState('');

  const handleTailorCV = async (job: any) => {
    if (!auth.currentUser) return;
    setLoadingAction(`tailor-${job.id}`);
    try {
      const profile = await cvService.getProfile(auth.currentUser.uid);
      if (!profile) {
        alert("No CV profile found. Please create one in CV Builder first.");
        return;
      }

      const tailoredSummary = await aiService.tailorCV(job, profile);

      setModalContent(tailoredSummary);
      setModalTitle('Tailored CV Summary');
      setModalType('cv');
      setActiveJobTitle(job.title);
      setModalOpen(true);
    } catch (e: any) {
      console.error(e);
      alert("Failed to tailor CV: " + e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCoverLetter = async (job: any) => {
    if (!auth.currentUser) return;
    setLoadingAction(`cover-${job.id}`);
    try {
      const profile = await cvService.getProfile(auth.currentUser.uid);
      if (!profile) {
        alert("No CV profile found.");
        return;
      }

      const letter = await aiService.writeCoverLetter(job, profile);

      setModalContent(letter);
      setModalTitle('Cover Letter');
      setModalType('cover-letter');
      setActiveJobTitle(job.title);
      setModalOpen(true);
    } catch (e: any) {
      console.error(e);
      alert("Failed to generate cover letter: " + e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto h-full">

      <main className="flex flex-1 justify-center py-8">
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1 px-4 sm:px-6 md:px-10">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
            {/* ... title and return button ... */}
            <div className="flex min-w-72 flex-col gap-1">
              <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Jobs to Apply</h1>
              <p className="text-slate-500 dark:text-[#92a4c9] text-base font-normal">Manage your saved academic opportunities and generate tailored documents.</p>
            </div>
            <button
              onClick={() => navigate(View.DISCOVER)}
              className="flex items-center gap-2 cursor-pointer overflow-hidden rounded-lg h-11 px-6 bg-slate-100 dark:bg-border-dark text-slate-700 dark:text-white text-sm font-bold leading-normal transition-all hover:bg-slate-200 dark:hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">swipe</span>
              <span>Return to Swiping</span>
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div className="w-full">
              <label className="flex flex-col h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
                  <div className="text-slate-400 dark:text-[#92a4c9] flex border-none bg-white dark:bg-border-dark items-center justify-center pl-4 rounded-l-xl border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-white dark:bg-border-dark h-full placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 rounded-l-none pl-2 text-base font-normal leading-normal" placeholder="Search saved jobs..." />
                </div>
              </label>
            </div>
            {/* ... status filters (All, High Match) can stay or be updated if needed ... */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary text-white px-4 text-sm font-semibold">
                <p>Saved Jobs ({savedJobs.length})</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {savedJobs.map((job, i) => (
              <div key={i} className="group flex flex-col md:flex-row items-stretch bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-border-dark/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div
                  className="md:w-48 h-32 md:h-auto bg-center bg-no-repeat bg-cover flex-shrink-0 bg-slate-100"
                  style={{ backgroundImage: job.raw_data?.imageUrl ? `url("${job.raw_data.imageUrl}")` : undefined }}
                >
                  {!job.raw_data?.imageUrl && <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>}
                </div>
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">stars</span> {job.raw_data?.matchScore || 85}% Match
                      </span>
                      <span className="text-slate-400 text-xs font-medium">{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Date Unknown'}</span>
                    </div>
                    <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">{job.title}</h3>
                    <p className="text-slate-500 dark:text-[#92a4c9] text-base font-medium">{job.employer} • {job.raw_data?.location || 'Remote'}</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold">{job.status}</p>
                    {job.link && (
                      <a href={job.link} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline mt-1 flex items-center gap-1">
                        View Original Post <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleTailorCV(job)}
                      disabled={loadingAction === `tailor-${job.id}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold transition-all hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    >
                      {loadingAction === `tailor-${job.id}` ? (
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">description</span>
                          <span className="truncate">Tailor CV (AI)</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCoverLetter(job)}
                      disabled={loadingAction === `cover-${job.id}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary/10 dark:bg-primary/20 text-primary dark:text-white text-sm font-bold border border-primary/20 transition-all hover:bg-primary/20 dark:hover:bg-primary/30 disabled:opacity-50"
                    >
                      {loadingAction === `cover-${job.id}` ? (
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                          <span className="truncate">Cover Letter (AI)</span>
                        </>
                      )}
                    </button>

                    {/* NEW BUTTON: MARK AS APPLIED */}
                    <button
                      onClick={() => markAsApplied(job.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-green-600 text-white text-sm font-bold transition-all hover:bg-green-700 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="truncate">Mark as Applied</span>
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="flex-none flex items-center justify-center gap-2 rounded-lg h-10 w-10 bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100"
                      title="Delete Job"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>

                  </div>
                </div>
              </div>
            ))}
            {savedJobs.length === 0 && <div className="text-center p-10 text-slate-500">No new saved jobs. Check the Tracker for applied jobs!</div>}
          </div>
        </div>
      </main>

      <GeneratedContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        content={modalContent}
        type={modalType}
        jobTitle={activeJobTitle}
      />
    </div>
  );
};

export default ApplicationsView;
