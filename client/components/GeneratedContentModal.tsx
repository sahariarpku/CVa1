import React from 'react';
import { generateDocx } from '../utils/docxGenerator';

interface GeneratedContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    type: 'cv' | 'cover-letter';
    jobTitle?: string;
}

const GeneratedContentModal: React.FC<GeneratedContentModalProps> = ({
    isOpen, onClose, title, content, type, jobTitle
}) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const filename = `${type === 'cv' ? 'Tailored_CV' : 'Cover_Letter'}_${jobTitle || 'AcademiaAI'}`.replace(/[^a-z0-9]/gi, '_');
        generateDocx(content, filename);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        alert('Copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#192233] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-[#324467]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-[#232f48]">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-[#92a4c9] mt-1">Review, copy, or download your generated document.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#232f48] text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#111722]/50">
                    <div className="bg-white dark:bg-[#192233] p-6 rounded-xl border border-slate-200 dark:border-[#232f48] shadow-sm">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                            {content}
                        </pre>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-6 border-t border-slate-100 dark:border-[#232f48] bg-white dark:bg-[#192233] flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={handleCopy}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#324467] text-slate-700 dark:text-white font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#232f48] transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                        Copy Text
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">description</span>
                        Download .docx
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratedContentModal;
