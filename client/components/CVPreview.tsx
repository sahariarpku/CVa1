
import React from 'react';
import { CVProfile } from '../types';

interface CVPreviewProps {
    profile: CVProfile;
}

const CVPreview: React.FC<CVPreviewProps> = ({ profile }) => {
    const { personal, education, experience, awards, publications, custom, skills, projects } = profile;

    const renderBullets = (text: string | undefined) => {
        if (!text) return null;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;
        return (
            <ul className="list-disc ml-4 space-y-0.5 mt-2 text-gray-800 leading-relaxed text-[0.95rem]">
                {lines.map((line, i) => (
                    <li key={i} className="pl-0.5">{line.trim().replace(/^[-•*]\s*/, '')}</li>
                ))}
            </ul>
        );
    };

    return (
        <div className="bg-white text-gray-900 w-full h-full min-h-[297mm] p-[20mm] shadow-2xl mx-auto text-[10pt] leading-relaxed font-serif antialiased overscroll-none print:shadow-none print:p-[15mm]" id="cv-preview">

            {/* Header */}
            <header className="mb-6 print:break-inside-avoid text-center">
                <h1 className="text-4xl font-bold uppercase tracking-wider mb-2 text-gray-900 font-serif">
                    {personal.fullName || 'Your Name'}
                </h1>

                <div className="flex flex-wrap justify-center gap-x-2 text-[0.9rem] text-gray-700 items-center">
                    {personal.email && <span>{personal.email}</span>}
                    {personal.phone && (
                        <>
                            <span className="text-gray-400">•</span>
                            <span>{personal.phone}</span>
                        </>
                    )}
                    {(personal.city || personal.address) && (
                        <>
                            <span className="text-gray-400">•</span>
                            <span>{personal.city || personal.address}</span>
                        </>
                    )}
                    {personal.linkedin && (
                        <>
                            <span className="text-gray-400">•</span>
                            <a href={personal.linkedin} className="hover:text-black hover:underline" target="_blank" rel="noreferrer">LinkedIn</a>
                        </>
                    )}
                    {personal.portfolio && (
                        <>
                            <span className="text-gray-400">•</span>
                            <a href={personal.portfolio} className="hover:text-black hover:underline" target="_blank" rel="noreferrer">Portfolio</a>
                        </>
                    )}
                </div>
            </header>

            {/* Summary */}
            {personal.summary && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Professional Summary</h2>
                    <p className="text-justify text-gray-800 leading-relaxed text-[0.95rem]">
                        {personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Work Experience</h2>
                    <div className="space-y-4">
                        {experience.map((exp, i) => (
                            <div key={i} className="print:break-inside-avoid">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-[1.05rem] text-gray-900">{exp.role}</h3>
                                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap tabular-nums">{exp.duration}</span>
                                </div>
                                <div className="text-[0.95rem] font-semibold italic text-gray-700 mb-1">{exp.company}</div>
                                {renderBullets(exp.description)}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {education.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Education</h2>
                    <div className="space-y-3">
                        {education.map((edu, i) => (
                            <div key={i} className="print:break-inside-avoid">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-[1.05rem] text-gray-900">{edu.institution}</h3>
                                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap tabular-nums">{edu.startDate} {edu.endDate ? `– ${edu.endDate}` : ''}</span>
                                </div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="italic text-[0.95rem] text-gray-800 font-medium">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                                    {edu.gpa && <span className="text-sm text-gray-600 font-medium">GPA: {edu.gpa}</span>}
                                </div>
                                {(edu.thesis || edu.courses) && (
                                    <div className="mt-1 pl-2 border-l-2 border-gray-200 text-[0.9rem] text-gray-700 space-y-0.5 ml-1">
                                        {edu.thesis && <p><span className="font-semibold text-gray-900">Thesis:</span> {edu.thesis}</p>}
                                        {edu.courses && <p><span className="font-semibold text-gray-900">Relevant Coursework:</span> {edu.courses}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Projects</h2>
                    <div className="space-y-3">
                        {projects.map((proj: any, i: number) => (
                            <div key={i} className="print:break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[1rem] text-gray-900">
                                        {proj.name}
                                        {proj.link && <a href={proj.link} className="ml-2 text-blue-700 text-xs font-normal hover:underline" target="_blank" rel="noreferrer">Viewing Link ↗</a>}
                                    </h3>
                                </div>
                                {renderBullets(proj.description)}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Skills</h2>
                    <div className="text-[0.95rem] text-gray-800 leading-relaxed text-justify">
                        <span className="font-semibold text-gray-900">Technical Skills: </span>
                        {skills.join(', ')}
                    </div>
                </section>
            )}

            {/* Publications */}
            {publications && publications.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Publications</h2>
                    <ul className="list-disc ml-5 space-y-2 text-[0.95rem] text-gray-800">
                        {publications.map((pub, i) => (
                            <li key={i} className="pl-1">
                                <span className="font-bold text-gray-900">{pub.title}</span>
                                {pub.link && <a href={pub.link} className="ml-1 text-blue-700 text-xs hover:underline" target="_blank" rel="noreferrer">[Link]</a>}.
                                <span className="italic text-gray-700"> {pub.authors}</span>.
                                {pub.venue && <span> {pub.venue},</span>} {pub.date}.
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Awards */}
            {awards && awards.length > 0 && (
                <section className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">Honors & Awards</h2>
                    <ul className="list-disc ml-5 space-y-1 text-[0.95rem] text-gray-800">
                        {awards.map((award, i) => (
                            <li key={i} className="pl-1">
                                <span className="font-bold text-gray-900">{award.title}</span>
                                {award.issuer && <> — <span className="italic">{award.issuer}</span></>}
                                {award.date && <span className="text-gray-600 text-sm"> ({award.date})</span>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Custom Sections */}
            {custom && custom.length > 0 && custom.map((sec, i) => (
                <section key={i} className="mb-5 print:break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-900 mb-3 pb-1 text-gray-900">{sec.title}</h2>
                    {renderBullets(sec.content) || <p className="whitespace-pre-line text-justify text-gray-800">{sec.content}</p>}
                </section>
            ))}

        </div>
    );
};

export default CVPreview;
