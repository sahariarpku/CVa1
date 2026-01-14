
import React, { useState, useEffect, useRef } from 'react';

import CVPreview from '../components/CVPreview';
import { View, CVProfile } from '../types';
import { cvService } from '../services/cvService';
import { auth } from '../src/lib/firebase';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const EMPTY_PROFILE: CVProfile = {
  personal: { fullName: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', summary: '', address: '', city: '', postcode: '' },
  education: [],
  experience: [],
  skills: [],
  projects: [],
  publications: [],
  awards: [],
  references: [],
  custom: []
};


// ... (imports remain similar, will be handled by the replacement context)
// But I need to preserve imports. I'll stick to a full file replacement or a very large block replacement to ensure I get the Modals in.
// Since the file is large, I'll do a full replace of the `CVBuilderView` component body.

const SECTIONS = [
  { id: 'general', label: 'General Information', icon: 'person' },
  { id: 'summary', label: 'Professional Summary', icon: 'description' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'experience', label: 'Work Experience', icon: 'work' },
  { id: 'skills', label: 'Skills', icon: 'psychology' },
  { id: 'projects', label: 'Projects', icon: 'rocket_launch' },
  { id: 'publications', label: 'Publications', icon: 'article' },
  { id: 'awards', label: 'Honors & Awards', icon: 'emoji_events' },
  { id: 'custom', label: 'Custom Section', icon: 'dashboard_customize' },
];

const INPUT_CLASS = "bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-all placeholder-slate-600 w-full";
const CARD_CLASS = "bg-[#161b22] border border-[#30363d] rounded-lg p-4 transition-all hover:border-slate-500 relative group";

// ... Modal uses INPUT_CLASS ...
const Modal = ({ title, children, onClose, onSave, actionLabel = 'Save' }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
      {/* ... wrapper ... */}
      <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-white font-bold text-lg tracking-tight">{title}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
        {children}
      </div>
      {/* ... footer ... */}
      <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02]">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
        <button onClick={onSave} className="px-5 py-2.5 bg-white text-black hover:bg-slate-200 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-white/5">
          <span className="material-symbols-outlined text-[18px]">check</span> {actionLabel}
        </button>
      </div>
    </div>
  </div>
);



const CVBuilderView: React.FC<{ navigate: (view: View) => void }> = ({ navigate }) => {
  const [profile, setProfile] = useState<CVProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [parseLoading, setParseLoading] = useState(false);
  const [improvingField, setImprovingField] = useState<string | null>(null);

  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [tempItem, setTempItem] = useState<any>(null); // For editing/adding
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [activeSection, setActiveSection] = useState('general');

  // Refs for scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Resizable logic
  const [editorWidth, setEditorWidth] = useState(600);
  const isResizing = useRef(false);

  // Preview State
  const [previewZoom, setPreviewZoom] = useState(0.9);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Global Improve Logic
  const improveWholeCV = async () => {
    if (improvingField) return;
    setImprovingField('whole');

    // 1. Summary
    let newSummary = profile.personal.summary;
    if (newSummary) {
      const imp = await cvService.improveText(newSummary, 'summary');
      if (imp) newSummary = imp;
    }

    // 2. Experience
    const newExperience = await Promise.all(profile.experience.map(async (exp) => {
      if (!exp.description) return exp;
      const imp = await cvService.improveText(exp.description, 'experience');
      return imp ? { ...exp, description: imp } : exp;
    }));

    // 3. Projects
    const newProjects = await Promise.all(profile.projects.map(async (proj) => {
      if (!proj.description) return proj;
      const imp = await cvService.improveText(proj.description, 'experience'); // 'experience' type usually works for bullets
      return imp ? { ...proj, description: imp } : proj;
    }));

    setProfile(prev => ({
      ...prev,
      personal: { ...prev.personal, summary: newSummary },
      experience: newExperience,
      projects: newProjects
    }));
    setImprovingField(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX - 256;
      if (newWidth > 300 && newWidth < 1200) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = () => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    const local = localStorage.getItem('cv_profile_local');
    if (local) { try { setProfile({ ...EMPTY_PROFILE, ...JSON.parse(local) }); } catch (e) { console.error(e); } }

    const user = auth.currentUser;
    if (user) {
      const data = await cvService.getProfile(user.uid);
      if (data) setProfile(prev => ({ ...prev, ...data }));
    }
    setLoading(false);
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    // Sanitize before save is critical
    const cleanProfile = JSON.parse(JSON.stringify(profile));
    localStorage.setItem('cv_profile_local', JSON.stringify(cleanProfile));

    const user = auth.currentUser;
    if (user) {
      const success = await cvService.saveProfile(cleanProfile, user.uid);
      setSaveStatus(success ? 'success' : 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setParseLoading(true);
      const data = await cvService.parseCV(e.target.files[0]);
      if (data) setProfile(prev => ({ ...prev, ...data, personal: { ...prev.personal, ...data.personal } }));
      setParseLoading(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!profile.personal.postcode) return;
    const data = await cvService.lookupAddress(profile.personal.postcode);
    if (data) {
      setProfile(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          postcode: data.postcode, // Auto-replace with formatted postcode
          city: data.city,
          address: `${data.city}, ${data.region}` // Fill address
        }
      }));
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('cv-preview');
    const opt = {
      margin: 0,
      filename: `${profile.personal.fullName.replace(/\s+/g, '_') || 'CV'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.99 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };


  const handleDownloadWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: profile.personal.fullName, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [
              new TextRun({ text: `${profile.personal.email} | ${profile.personal.phone || ''} | ${profile.personal.city || ''}`, color: "666666" })
            ]
          }),
          ...(profile.personal.linkedin || profile.personal.github ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${profile.personal.linkedin || ''} ${profile.personal.github ? ' | ' + profile.personal.github : ''}`,
                  color: "0057b7"
                })
              ]
            })
          ] : []),
          new Paragraph({ text: "" }), // Spacer

          new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: profile.personal.summary || "N/A" }),

          new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
          ...profile.education.map(edu => [
            new Paragraph({ text: `${edu.degree} - ${edu.institution}`, heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ children: [new TextRun({ text: `${edu.startDate} - ${edu.endDate || 'Present'}`, italics: true })] }),
            edu.gpa ? new Paragraph({ text: `GPA: ${edu.gpa}` }) : null,
            edu.thesis ? new Paragraph({ text: `Thesis: ${edu.thesis}` }) : null,
            new Paragraph({ text: "" })
          ]).flat().filter(Boolean) as any[],

          new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }),
          ...profile.experience.map(exp => [
            new Paragraph({ text: `${exp.role} at ${exp.company}`, heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ children: [new TextRun({ text: exp.duration, italics: true })] }),
            new Paragraph({ text: exp.description }),
            new Paragraph({ text: "" })
          ]).flat(),

          ...(profile.projects.length > 0 ? [
            new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2 }),
            ...profile.projects.map(p => [
              new Paragraph({ text: p.name, heading: HeadingLevel.HEADING_3 }),
              p.link ? new Paragraph({ children: [new TextRun({ text: p.link, color: "0057b7" })] }) : null,
              new Paragraph({ text: p.description }),
              new Paragraph({ text: "" })
            ]).flat().filter(Boolean)
          ] : []),

          ...(profile.skills.length > 0 ? [
            new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: profile.skills.join(", ") })
          ] : []),

          ...(profile.awards.length > 0 ? [
            new Paragraph({ text: "Honors & Awards", heading: HeadingLevel.HEADING_2 }),
            ...profile.awards.map(a => [
              new Paragraph({ text: `${a.title} - ${a.issuer}`, heading: HeadingLevel.HEADING_3 }),
              new Paragraph({ text: a.date }),
              new Paragraph({ text: a.description || "" }),
            ]).flat()
          ] : []),

          ...(profile.publications.length > 0 ? [
            new Paragraph({ text: "Publications", heading: HeadingLevel.HEADING_2 }),
            ...profile.publications.map(p => [
              new Paragraph({ text: p.title, heading: HeadingLevel.HEADING_3 }),
              new Paragraph({ text: `${p.venue} (${p.date})` }),
              p.link ? new Paragraph({ children: [new TextRun({ text: p.link, color: "0057b7" })] }) : null,
            ]).flat().filter(Boolean)
          ] : []),

          ...(profile.custom && profile.custom.length > 0 ? profile.custom.map(c => [
            new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: c.content })
          ]).flat() : [])
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${profile.personal.fullName.replace(/\s+/g, '_') || 'CV'}.docx`);
    });
  };

  const handleDownloadMD = () => {
    let md = `# ${profile.personal.fullName}\n\n`;
    md += `${profile.personal.email} | ${profile.personal.phone || ''} | ${profile.personal.city || ''}\n`;
    if (profile.personal.linkedin) md += `LinkedIn: ${profile.personal.linkedin}\n`;
    if (profile.personal.github) md += `GitHub: ${profile.personal.github}\n`;
    if (profile.personal.portfolio) md += `Portfolio: ${profile.personal.portfolio}\n`;
    md += `\n`;

    if (profile.personal.summary) {
      md += `## Professional Summary\n${profile.personal.summary}\n\n`;
    }

    if (profile.education.length > 0) {
      md += `## Education\n`;
      profile.education.forEach(edu => {
        md += `### ${edu.degree} - ${edu.institution}\n`;
        md += `*${edu.startDate} - ${edu.endDate || 'Present'}*\n`;
        if (edu.gpa) md += `- GPA: ${edu.gpa}\n`;
        if (edu.thesis) md += `- Thesis: ${edu.thesis}\n`;
        if (edu.courses) md += `- Courses: ${edu.courses}\n`;
        md += `\n`;
      });
    }

    if (profile.experience.length > 0) {
      md += `## Work Experience\n`;
      profile.experience.forEach(exp => {
        md += `### ${exp.role} at ${exp.company}\n`;
        md += `*${exp.duration}*\n`;
        md += `${exp.description}\n\n`;
      });
    }

    if (profile.projects.length > 0) {
      md += `## Projects\n`;
      profile.projects.forEach(p => {
        md += `### ${p.name}\n`;
        if (p.link) md += `[Link](${p.link})\n`;
        md += `${p.description}\n\n`;
      });
    }

    if (profile.skills.length > 0) {
      md += `## Skills\n${profile.skills.join(', ')}\n\n`;
    }

    if (profile.publications.length > 0) {
      md += `## Publications\n`;
      profile.publications.forEach(p => {
        md += `- **${p.title}**\n  ${p.venue} (${p.date})\n  ${p.link ? `[Link](${p.link})` : ''}\n`;
      });
      md += `\n`;
    }

    if (profile.awards.length > 0) {
      md += `## Honors & Awards\n`;
      profile.awards.forEach(a => {
        md += `- **${a.title}** - ${a.issuer} (${a.date})\n  ${a.description || ''}\n`;
      });
      md += `\n`;
    }

    if (profile.custom && profile.custom.length > 0) {
      profile.custom.forEach(c => {
        md += `## ${c.title}\n${c.content}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.personal.fullName.replace(/\s+/g, '_') || 'resume'}.md`;
    a.click();
  };

  const improveField = async (text: string, fieldName: string, isTemp: boolean = false) => {
    if (!text || improvingField) return; // Use improvingField state to prevent multiple calls
    setImprovingField(fieldName);
    const improved = await cvService.improveText(text, fieldName.includes('summary') ? 'summary' : 'experience');
    if (improved) {
      if (isTemp) {
        setTempItem((prev: any) => ({ ...prev, description: improved })); // Assume description for modal
      } else {
        // Assume summary for now
        setProfile(prev => ({ ...prev, personal: { ...prev.personal, summary: improved } }));
      }
    }
    setImprovingField(null);
  };

  // Helper to open modal
  // Helper to open modal
  const openModal = (type: string, item: any = null, index: number | null = null) => {
    // Initialize default structure based on type
    let initialItem = item;
    if (!initialItem) {
      if (type === 'education') initialItem = { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', thesis: '', courses: '' };
      if (type === 'experience') initialItem = { role: '', company: '', duration: '', description: '' };
      if (type === 'projects') initialItem = { name: '', link: '', description: '' };
      if (type === 'awards') initialItem = { title: '', issuer: '', date: '', description: '' };
      if (type === 'publications') initialItem = { title: '', authors: '', venue: '', date: '', link: '', doi: '', description: '' };
      if (type === 'custom') initialItem = { title: '', content: '' };
    }
    setTempItem(initialItem);
    setEditIndex(index);
    setActiveModal(type);
  };

  const saveModalItem = () => {
    if (!activeModal || !tempItem) return;
    setProfile(prev => {
      const list = [...((prev as any)[activeModal] || [])];
      if (editIndex !== null && editIndex >= 0) {
        list[editIndex] = tempItem; // Update existing
      } else {
        list.push(tempItem); // Add new
      }
      return { ...prev, [activeModal]: list };
    });
    setActiveModal(null);
    setTempItem(null);
    setEditIndex(null);
  };

  // Generic remove helper
  const removeItem = (section: string, index: number) => {
    setProfile(prev => {
      const list = [...(prev as any)[section]];
      list.splice(index, 1);
      return { ...prev, [section]: list };
    });
  };


  return (
    <div className="flex flex-col flex-1 h-full bg-[#0f1115] text-slate-300 font-sans overflow-hidden">

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f1115] border-r border-white/5 flex flex-col p-4 shrink-0 z-20 hidden md:flex">
          <div className="mb-8 px-2">
            <h2 className="text-white font-bold text-lg mb-1">Sections</h2>
            <p className="text-xs text-slate-500">Jump to section</p>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 text-slate-400 hover:text-white transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Editor */}
        <main
          className="flex-none border-r border-white/5 flex flex-col h-full bg-[#0f1115] z-10 overflow-hidden"
          style={{ width: editorWidth }}
        >
          {/* Header Actions - Fixed */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 bg-[#0f1115]">
            <h1 className="text-xl font-bold text-white">Editor</h1>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-sm">{parseLoading ? 'hourglass_empty' : 'upload_file'}</span>
                {parseLoading ? 'Importing...' : 'Import'}
                <input type="file" onChange={handleFileUpload} accept=".pdf,.docx,application/pdf" className="hidden" disabled={parseLoading} />
              </label>
              <button onClick={handleSave} disabled={saveStatus === 'saving'} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-2 ${saveStatus === 'success' ? 'bg-green-600' : saveStatus === 'error' ? 'bg-red-600' : 'bg-primary hover:bg-primary/80'}`}>
                <span className="material-symbols-outlined text-sm">save</span>
                {saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handleDownloadPDF} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white ml-2" title="Download PDF"><span className="material-symbols-outlined text-sm">picture_as_pdf</span></button>
              <button onClick={handleDownloadWord} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Download Word"><span className="material-symbols-outlined text-sm">description</span></button>
              <button onClick={handleDownloadMD} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Download Markdown"><span className="material-symbols-outlined text-sm">markdown</span></button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20">
            <div className="space-y-12">
              {/* General */}
              <section ref={el => sectionRefs.current['general'] = el} className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">person</span> General Info</h3>
                <div className="grid grid-cols-1 gap-3">
                  <input className={INPUT_CLASS} value={profile.personal.fullName} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, fullName: e.target.value } })} placeholder="Full Name" />
                  <input className={INPUT_CLASS} value={profile.personal.email} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, email: e.target.value } })} placeholder="Email" />
                  <input className={INPUT_CLASS} value={profile.personal.phone} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, phone: e.target.value } })} placeholder="Phone" />
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input className={`${INPUT_CLASS} w-32`} value={profile.personal.postcode || ''} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, postcode: e.target.value } })} placeholder="Postcode" />
                      <button onClick={handleAddressSearch} className="px-4 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition-colors">Find Address</button>
                    </div>
                    <input className={INPUT_CLASS} value={profile.personal.address} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, address: e.target.value } })} placeholder="Address (City, Region...)" />
                  </div>
                  <input className={INPUT_CLASS} value={profile.personal.linkedin} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, linkedin: e.target.value } })} placeholder="LinkedIn URL" />
                  <input className={INPUT_CLASS} value={profile.personal.github || ''} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, github: e.target.value } })} placeholder="GitHub URL" />
                  <input className={INPUT_CLASS} value={profile.personal.portfolio || ''} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, portfolio: e.target.value } })} placeholder="Portfolio URL" />
                </div>
              </section>

              {/* Summary */}
              <section ref={el => sectionRefs.current['summary'] = el} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">description</span> Summary</h3>
                  <button onClick={() => improveField(profile.personal.summary || '', 'summary')} className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1 border border-purple-500/20 uppercase tracking-wide" disabled={improvingField === 'summary'}><span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span> {improvingField === 'summary' ? 'Improving...' : 'AI Improve'}</button>
                </div>
                <textarea className={`${INPUT_CLASS} min-h-[120px]`} value={profile.personal.summary || ''} onChange={e => setProfile({ ...profile, personal: { ...profile.personal, summary: e.target.value } })} placeholder="Professional summary..." />
              </section>

              {/* Arrays Sections */}
              {[
                { id: 'education', title: 'Education', icon: 'school', render: (item: any) => `${item.degree} at ${item.institution}` },
                { id: 'experience', title: 'Work Experience', icon: 'work', render: (item: any) => `${item.role} at ${item.company}` },
                { id: 'projects', title: 'Projects', icon: 'rocket_launch', render: (item: any) => item.name },
                { id: 'awards', title: 'Honors & Awards', icon: 'emoji_events', render: (item: any) => item.title },
                { id: 'publications', title: 'Publications', icon: 'article', render: (item: any) => item.title },
                { id: 'custom', title: 'Custom Sections', icon: 'dashboard_customize', render: (item: any) => item.title }
              ].map(sec => (
                <section key={sec.id} ref={el => sectionRefs.current[sec.id] = el} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">{sec.icon}</span> {sec.title}</h3>
                    <button onClick={() => openModal(sec.id)} className="text-primary text-xs font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-full">+ Add New</button>
                  </div>
                  <div className="space-y-3">
                    {((profile as any)[sec.id] || []).map((item: any, idx: number) => (
                      <div key={idx} className={`${CARD_CLASS} cursor-pointer hover:bg-white/5 transition-colors`} onClick={() => openModal(sec.id, item, idx)}>
                        <button onClick={(e) => { e.stopPropagation(); removeItem(sec.id, idx); }} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/10 rounded"><span className="material-symbols-outlined text-sm">delete</span></button>
                        <p className="font-bold text-sm text-white pr-6">{sec.render(item)}</p>
                        <p className="text-xs text-slate-400 truncate mt-1">{item.description || item.year || item.startDate || 'No details'}</p>
                      </div>
                    ))}
                    {((profile as any)[sec.id] || []).length === 0 && <p className="text-xs text-slate-600 italic px-2 py-4 text-center border border-white/5 rounded-xl border-dashed">No items added yet</p>}
                  </div>
                </section>
              ))}

              {/* Skills */}
              <section ref={el => sectionRefs.current['skills'] = el} className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">psychology</span> Skills</h3>
                <textarea className={`${INPUT_CLASS} min-h-[100px]`} value={profile.skills.join(', ')} onChange={e => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })} placeholder="List skills separated by comma..." />
              </section>
            </div>
          </div>
        </main>

        {/* Resizer Handle */}
        <div
          className="w-1 hover:w-1.5 bg-white/5 hover:bg-primary transition-all cursor-col-resize z-30 flex-none h-full"
          onMouseDown={startResizing}
        />

        {/* Live Preview Column */}
        <div className={`flex-1 bg-[#1c2128] flex flex-col relative transition-all ${isFullScreen ? 'fixed inset-0 z-[100]' : 'overflow-hidden'}`}>

          {/* Preview Toolbar */}
          <div className="h-14 border-b border-white/5 bg-[#0f1115] flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Zoom Out"><span className="material-symbols-outlined text-sm">remove</span></button>
              <span className="text-xs font-mono text-slate-500 w-12 text-center select-none">{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Zoom In"><span className="material-symbols-outlined text-sm">add</span></button>
              <button onClick={() => setPreviewZoom(0.9)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white ml-1 transition-colors" title="Reset"><span className="material-symbols-outlined text-sm">restart_alt</span></button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <button onClick={() => setIsFullScreen(!isFullScreen)} className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isFullScreen ? 'text-primary' : 'text-slate-400 hover:text-white'}`} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}><span className="material-symbols-outlined text-sm">{isFullScreen ? 'close_fullscreen' : 'open_in_full'}</span></button>
            </div>

            <button
              onClick={improveWholeCV}
              disabled={improvingField === 'whole'}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold transition-all uppercase tracking-wide disabled:opacity-50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <span className={`material-symbols-outlined text-sm ${improvingField === 'whole' ? 'animate-spin' : 'animate-pulse'}`}>auto_awesome</span>
              {improvingField === 'whole' ? 'Improving All...' : 'Improve Whole CV'}
            </button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start bg-[#1c2128/50]">
            <div
              id="cv-preview"
              className="bg-white shadow-2xl transition-transform duration-200 origin-top"
              style={{
                width: '210mm',
                minHeight: '297mm',
                transform: `scale(${previewZoom})`
              }}
            >
              <CVPreview profile={profile} />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {activeModal === 'education' && (
        <Modal title="Add New Education" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Education">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Institution Name</span><input className={INPUT_CLASS} autoFocus value={tempItem.institution} onChange={e => setTempItem({ ...tempItem, institution: e.target.value })} placeholder="e.g. University of Example" /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Degree</span><input className={INPUT_CLASS} value={tempItem.degree} onChange={e => setTempItem({ ...tempItem, degree: e.target.value })} placeholder="e.g. Bachelor of Science" /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Field of Study</span><input className={INPUT_CLASS} value={tempItem.fieldOfStudy} onChange={e => setTempItem({ ...tempItem, fieldOfStudy: e.target.value })} placeholder="e.g. Computer Science" /></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1"><span className="text-xs text-slate-400">Start Date</span><input className={INPUT_CLASS} type="text" value={tempItem.startDate} onChange={e => setTempItem({ ...tempItem, startDate: e.target.value })} placeholder="YYYY-MM" /></label>
            <label className="block space-y-1"><span className="text-xs text-slate-400">End Date</span><input className={INPUT_CLASS} type="text" value={tempItem.endDate} onChange={e => setTempItem({ ...tempItem, endDate: e.target.value })} placeholder="YYYY-MM or Present" /></label>
          </div>
          <label className="block space-y-1"><span className="text-xs text-slate-400">GPA / Result (Optional)</span><input className={INPUT_CLASS} value={tempItem.gpa} onChange={e => setTempItem({ ...tempItem, gpa: e.target.value })} placeholder="3.8/4.0" /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Thesis / Project</span><input className={INPUT_CLASS} value={tempItem.thesis} onChange={e => setTempItem({ ...tempItem, thesis: e.target.value })} placeholder="Title of thesis or major project" /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Relevant Courses</span><textarea className={`${INPUT_CLASS} h-20`} value={tempItem.courses} onChange={e => setTempItem({ ...tempItem, courses: e.target.value })} placeholder="Comma separated..." /></label>
        </Modal>
      )}
      {activeModal === 'experience' && (
        <Modal title="Add Experience" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Experience">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Role / Title</span><input className={INPUT_CLASS} autoFocus value={tempItem.role} onChange={e => setTempItem({ ...tempItem, role: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Company</span><input className={INPUT_CLASS} value={tempItem.company} onChange={e => setTempItem({ ...tempItem, company: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Duration</span><input className={INPUT_CLASS} value={tempItem.duration} onChange={e => setTempItem({ ...tempItem, duration: e.target.value })} placeholder="e.g. Jan 2020 - Present" /></label>
          <div className="flex justify-between mt-2 mb-1">
            <span className="text-xs text-slate-400">Description</span>
            <button onClick={() => improveField(tempItem.description, 'experience', true)} className="text-[10px] font-bold mt-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1 border border-purple-500/20 uppercase tracking-wide" disabled={improvingField === 'experience'}><span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span> {improvingField === 'experience' ? 'Improving...' : 'AI Improve'}</button>
          </div>
          <textarea className={`${INPUT_CLASS} h-32`} value={tempItem.description} onChange={e => setTempItem({ ...tempItem, description: e.target.value })} placeholder="Bullet points..." />
        </Modal>
      )}
      {activeModal === 'projects' && (
        <Modal title="Add Project" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Project">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Project Name</span><input className={INPUT_CLASS} autoFocus value={tempItem.name} onChange={e => setTempItem({ ...tempItem, name: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Link (Optional)</span><input className={INPUT_CLASS} value={tempItem.link} onChange={e => setTempItem({ ...tempItem, link: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Description</span><textarea className={`${INPUT_CLASS} h-32`} value={tempItem.description} onChange={e => setTempItem({ ...tempItem, description: e.target.value })} /></label>
        </Modal>
      )}
      {activeModal === 'awards' && (
        <Modal title="Add Honor/Award" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Award">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Award Name</span><input className={INPUT_CLASS} autoFocus value={tempItem.title} onChange={e => setTempItem({ ...tempItem, title: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Issuer / Organization</span><input className={INPUT_CLASS} value={tempItem.issuer} onChange={e => setTempItem({ ...tempItem, issuer: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Date</span><input className={INPUT_CLASS} value={tempItem.date} onChange={e => setTempItem({ ...tempItem, date: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Description</span><textarea className={`${INPUT_CLASS} h-24`} value={tempItem.description} onChange={e => setTempItem({ ...tempItem, description: e.target.value })} /></label>
        </Modal>
      )}
      {activeModal === 'publications' && (
        <Modal title="Add Publication" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Publication">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Title</span><input className={INPUT_CLASS} autoFocus value={tempItem.title} onChange={e => setTempItem({ ...tempItem, title: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Authors</span><input className={INPUT_CLASS} value={tempItem.authors} onChange={e => setTempItem({ ...tempItem, authors: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Venue (Journal/Conf)</span><input className={INPUT_CLASS} value={tempItem.venue} onChange={e => setTempItem({ ...tempItem, venue: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Date</span><input className={INPUT_CLASS} value={tempItem.date} onChange={e => setTempItem({ ...tempItem, date: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Link</span><input className={INPUT_CLASS} value={tempItem.link} onChange={e => setTempItem({ ...tempItem, link: e.target.value })} /></label>
        </Modal>
      )}
      {activeModal === 'custom' && (
        <Modal title="Add Custom Section" onClose={() => setActiveModal(null)} onSave={saveModalItem} actionLabel="Add Section">
          <label className="block space-y-1"><span className="text-xs text-slate-400">Section Title</span><input className={INPUT_CLASS} autoFocus value={tempItem.title} onChange={e => setTempItem({ ...tempItem, title: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-400">Content (Markdown supported)</span><textarea className={`${INPUT_CLASS} h-40`} value={tempItem.content} onChange={e => setTempItem({ ...tempItem, content: e.target.value })} /></label>
        </Modal>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

        @media print {
          body * { visibility: hidden; }
          #cv-preview, #cv-preview * { visibility: visible; }
          #cv-preview {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0;
            padding: 15mm !important; box-shadow: none; background: white; color: black;
          }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
};

export default CVBuilderView;
