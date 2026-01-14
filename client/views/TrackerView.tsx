
import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { db, auth, storage } from '../src/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TrackerView: React.FC<{ navigate: (view: View) => void }> = ({ navigate }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log("TrackerView: No user logged in yet, skipping query setup");
      setIsLoading(false);
      setApplications([]);
      return;
    }

    console.log("TrackerView: Setting up listener for user:", auth.currentUser.uid);
    setIsLoading(true);

    const q = query(
      collection(db, "applications"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setApplications(parsedJobs);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to listen to saved jobs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, jobId: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Validate PDF
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    try {
      const storageRef = ref(storage, `cvs/${auth.currentUser?.uid}/${jobId}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, "applications", jobId), {
        cvUrl: downloadURL,
        cvName: file.name
      });
      alert("CV Uploaded Successfully!");
    } catch (error) {
      console.error("Error uploading CV:", error);
      alert("Failed to upload CV");
    }
  };

  const deleteCV = async (jobId: string, cvUrl: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;
    try {
      // Delete from storage (optional, or just unlink) - extracting path is hard from URL, so we just unlink for now
      // Ideally we store storagePath in Firestore too, but for speed we just unlink
      await updateDoc(doc(db, "applications", jobId), {
        cvUrl: null,
        cvName: null
      });
    } catch (e) {
      console.error("Error deleting CV:", e);
      alert("Failed to delete CV");
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to remove this application?")) return;
    try {
      await deleteDoc(doc(db, "applications", jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f1115] overflow-y-auto">

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 pb-4 flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black tracking-tight">Application Tracker</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Organize and optimize your academic journey with AI-driven insights.</p>
            </div>
            <div className="flex gap-2">
              <button className="h-10 px-4 flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-bold">
                Export CSV
              </button>
              <button className="h-10 px-4 flex items-center gap-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-sm">add</span>
                New Application
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-bold">All</button>
              <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-bold">Interviewing</button>
            </div>
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg pl-10 pr-4 h-9 text-xs" placeholder="Search applications..." type="text" />
            </div>
          </div>
        </header>

        <section className="px-8 pb-8 flex-1">
          <div className="bg-white dark:bg-[#161d2b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1c2638] text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Job Name & Institution</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4 text-center">Link</th>
                    <th className="px-6 py-4 text-center">CV</th>
                    <th className="px-6 py-4 text-center">Cover Letter</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading applications...</td></tr>
                  ) : applications.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No saved applications yet. Go to Discover to find jobs!</td></tr>
                  ) : (
                    applications.map((row) => {
                      const jobDetails = { ...(row.raw_data || {}), ...row };
                      return (
                        <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">{jobDetails.title}</span>
                              <span className="text-xs text-slate-500 mt-0.5">{jobDetails.employer || jobDetails.institution}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-500">{jobDetails.location || 'Remote'}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${row.status === 'Interviewing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50' :
                              row.status === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50' :
                                row.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
                              }`}>
                              {row.status || 'Saved'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-slate-500">{jobDetails.deadline ? `Deadline: ${jobDetails.deadline}` : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '—')}</td>
                          <td className="px-6 py-5 text-center">
                            {jobDetails.link ? (
                              <a
                                href={jobDetails.link}
                                target="_blank"
                                rel="noreferrer"
                                className="size-8 rounded-lg bg-blue-500/10 text-blue-500 inline-flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                                title="View Job Post"
                              >
                                <span className="material-symbols-outlined text-[18px]">captive_portal</span>
                              </a>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {jobDetails.cvUrl ? (
                              <div className="flex items-center justify-center gap-2">
                                <a
                                  href={jobDetails.cvUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline"
                                  title={jobDetails.cvName || "View CV"}
                                >
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                  View
                                </a>
                                <button
                                  onClick={() => deleteCV(row.id, jobDetails.cvUrl)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete CV"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-sm text-slate-500">upload</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload</span>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, row.id)}
                                />
                              </label>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center justify-center">
                              <span className="material-symbols-outlined">upload_file</span>
                            </button>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => deleteJob(row.id)}
                              className="size-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 inline-flex items-center justify-center transition-colors"
                              title="Delete Application"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50 dark:bg-[#1c2638]">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">1 Interview Pending</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Powered by Gemini Optimization</p>
                <span className="material-symbols-outlined text-primary text-lg !fill-1">verified</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrackerView;
