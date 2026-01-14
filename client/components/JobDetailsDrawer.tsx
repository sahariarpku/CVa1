import React, { useState, useRef } from 'react';
import { db, auth } from '../src/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface JobDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
}

const JobDetailsDrawer: React.FC<JobDetailsDrawerProps> = ({ isOpen, onClose, job }) => {
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [note, setNote] = useState(job?.notes || '');
    const [savingNote, setSavingNote] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local note state when job changes
    React.useEffect(() => {
        setNote(job?.notes || '');
    }, [job]);

    if (!isOpen || !job) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        // Size Check (Firestore limit is 1MB, safe limit ~700KB for base64 overhead)
        if (file.size > 700 * 1024) {
            alert("File too large! Please upload files smaller than 700KB for free cloud storage.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Content = reader.result as string;
                const fileId = `${auth.currentUser?.uid}_${Date.now()}`; // Unique ID

                // 1. Store File Content in separate collection `file_storage`
                await setDoc(doc(db, "file_storage", fileId), {
                    content: base64Content,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    userId: auth.currentUser?.uid,
                    uploadedAt: new Date().toISOString()
                });

                // 2. Store Metadata in `applications` document
                const newDoc = {
                    fileId: fileId,
                    name: file.name,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                };

                await updateDoc(doc(db, "applications", job.id), {
                    documents: arrayUnion(newDoc)
                });

                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };

            reader.onerror = (error) => {
                console.error("File reading error:", error);
                alert("Failed to read file.");
                setUploading(false);
            };

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file to cloud.");
            setUploading(false);
        }
    };

    const handleDownload = async (fileDoc: any) => {
        // Legacy support checks
        if (fileDoc.url) {
            window.open(fileDoc.url, '_blank');
            return;
        }
        if (!fileDoc.fileId) return;

        setDownloading(fileDoc.fileId);
        try {
            const fileSnapshot = await getDoc(doc(db, "file_storage", fileDoc.fileId));
            if (fileSnapshot.exists()) {
                const data = fileSnapshot.data();
                const link = document.createElement('a');
                link.href = data.content; // Base64 Data URL
                link.download = data.name || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("File not found (it might have been deleted).");
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download file.");
        } finally {
            setDownloading(null);
        }
    }

    const handleDeleteFile = async (fileDoc: any) => {
        if (!confirm(`Delete ${fileDoc.name}?`)) return;
        try {
            // Remove from Firestore Metadata
            await updateDoc(doc(db, "applications", job.id), {
                documents: arrayRemove(fileDoc)
            });

            // Delete actual file content if it uses new system
            if (fileDoc.fileId) {
                await deleteDoc(doc(db, "file_storage", fileDoc.fileId)).catch(console.warn);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete file.");
        }
    };

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await updateDoc(doc(db, "applications", job.id), {
                notes: note
            });
        } catch (error) {
            console.error("Save note failed", error);
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full max-w-xl bg-white dark:bg-[#0f1115] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f1115]">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <select
                                value={job.status || 'Saved'}
                                onChange={(e) => updateDoc(doc(db, "applications", job.id), { status: e.target.value })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-transparent focus:ring-0 cursor-pointer ${job.status === 'Interviewing' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    job.status === 'Submitted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                            >
                                <option value="Saved">Saved</option>
                                <option value="Applied">Applied</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Offer">Offer</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <span className="text-xs text-slate-400 font-mono">Added {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <input
                            value={job.title}
                            onChange={(e) => updateDoc(doc(db, "applications", job.id), { title: e.target.value })}
                            className="text-2xl font-black text-slate-900 dark:text-white leading-tight bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-slate-300"
                            placeholder="Job Title"
                        />
                        <input
                            value={job.employer}
                            onChange={(e) => updateDoc(doc(db, "applications", job.id), { employer: e.target.value })}
                            className="text-slate-500 font-medium bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-slate-300"
                            placeholder="Company / Institution"
                        />
                        <input
                            value={job.location || ''}
                            onChange={(e) => updateDoc(doc(db, "applications", job.id), { location: e.target.value })}
                            className="text-sm text-slate-400 bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-slate-200 mt-1"
                            placeholder="Location (e.g. Remote, London)"
                        />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close_fullscreen</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Documents Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">folder_open</span>
                                Documents
                            </h3>
                            <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">upload</span>}
                                {uploading ? 'Uploading...' : 'Upload File'}
                                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <div className="space-y-2">
                            {/* Specific CV Field (Legacy compatibility) */}
                            {job.cvUrl && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{job.cvName || 'Main CV'}</p>
                                            <p className="text-[10px] text-slate-400">Primary CV</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={job.cvUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white dark:hover:bg-black text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Additional Documents */}
                            {job.documents?.map((doc: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">draft</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{doc.name}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            disabled={downloading === doc.fileId}
                                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-black text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                                        >
                                            {downloading === doc.fileId ?
                                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> :
                                                <span className="material-symbols-outlined text-lg">download</span>
                                            }
                                        </button>
                                        <button onClick={() => handleDeleteFile(doc)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-black text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {(!job.documents?.length && !job.cvUrl) && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                                    <p className="text-sm">No documents uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notes Section */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-lg">edit_note</span>
                            Notes
                        </h3>
                        <div className="relative">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={handleSaveNote}
                                placeholder="Jot down interview notes, questions, or formatting ideas..."
                                className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                            />
                            {savingNote && (
                                <span className="absolute bottom-4 right-4 text-xs text-slate-400 flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Saving...
                                </span>
                            )}
                        </div>
                    </section>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
                        <p className="font-bold flex items-center gap-1 mb-1"><span className="material-symbols-outlined text-sm">cloud</span> Cloud Storage Active</p>
                        <p>Files are stored securely in Firestore (Max 700KB per file).</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default JobDetailsDrawer;
