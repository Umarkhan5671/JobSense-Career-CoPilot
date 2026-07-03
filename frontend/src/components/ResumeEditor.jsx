import React, { useState } from 'react';
import { generateTailoredResume } from '../lib/api';
import { Download, Plus, Trash2, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResumeEditor({ initialResume, report }) {
  const [resume, setResume] = useState(initialResume || {
    contact_info: { name: '', title: '', email: '', phone: '', location: '', website: '' },
    professional_summary: '',
    work_experience: [],
    education: [],
    skills: [],
    certifications: []
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Contact Info Changes
  const handleContactChange = (field, value) => {
    setResume(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }));
  };

  // 2. Work Experience Changes
  const handleExperienceChange = (index, field, value) => {
    const updated = [...resume.work_experience];
    updated[index][field] = value;
    setResume(prev => ({ ...prev, work_experience: updated }));
  };

  const handleBulletChange = (expIndex, bulletIndex, value) => {
    const updated = [...resume.work_experience];
    updated[expIndex].bullets[bulletIndex] = value;
    setResume(prev => ({ ...prev, work_experience: updated }));
  };

  const addBullet = (expIndex) => {
    const updated = [...resume.work_experience];
    updated[expIndex].bullets.push('');
    setResume(prev => ({ ...prev, work_experience: updated }));
  };

  const removeBullet = (expIndex, bulletIndex) => {
    const updated = [...resume.work_experience];
    updated[expIndex].bullets.splice(bulletIndex, 1);
    setResume(prev => ({ ...prev, work_experience: updated }));
  };

  // 3. Education Changes
  const handleEducationChange = (index, field, value) => {
    const updated = [...resume.education];
    updated[index][field] = value;
    setResume(prev => ({ ...prev, education: updated }));
  };

  // 4. Skills Changes
  const handleSkillChange = (index, value) => {
    const updated = [...resume.skills];
    updated[index] = value;
    setResume(prev => ({ ...prev, skills: updated }));
  };

  const addSkill = () => {
    setResume(prev => ({
      ...prev,
      skills: [...(prev.skills || []), '']
    }));
  };

  const removeSkill = (index) => {
    setResume(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }));
  };

  // 5. Certifications Changes
  const handleCertificationChange = (index, value) => {
    const updated = [...(resume.certifications || [])];
    updated[index] = value;
    setResume(prev => ({ ...prev, certifications: updated }));
  };

  const addCertification = () => {
    setResume(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), '']
    }));
  };

  const removeCertification = (index) => {
    setResume(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index)
    }));
  };

  // 6. PDF Generation & Trigger Download
  const handleDownload = async () => {
    setIsExporting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const pdfBlob = await generateTailoredResume(report, resume);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resume.contact_info.name || 'tailored'}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Tailored resume PDF generated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate resume PDF. Please check backend log.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-dark-panel border border-dark-border rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 font-sans text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dark-border">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-brand-bronze" />
            Tailored Resume Editor
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Review and fine-tune your tailored resume. Click download to export it as a clean, professionally formatted PDF.
          </p>
          {report && report.tailored_resume_best_score !== undefined && (
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-bronze/10 border border-brand-bronze/25 rounded-xl text-xs font-bold text-brand-bronze">
              <span>Original Match: {report.original_match_score ?? report.match_score}%</span>
              <span className="text-slate-500">→</span>
              <span>Tailored Match: {report.tailored_resume_best_score}%</span>
            </div>
          )}
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 transform active:scale-95 ${
            isExporting
              ? 'bg-slate-800 border border-dark-border text-slate-500 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-700 text-dark-base cursor-pointer font-bold'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-dark-base" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Tailored Resume (PDF)
            </>
          )}
        </button>
      </div>


      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400" />
          {errorMsg}
        </div>
      )}

      {/* 1. Header Info section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          1. Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={resume.contact_info.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Professional Subtitle</label>
            <input
              type="text"
              value={resume.contact_info.title}
              onChange={(e) => handleContactChange('title', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={resume.contact_info.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
            <input
              type="text"
              value={resume.contact_info.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</label>
            <input
              type="text"
              value={resume.contact_info.location}
              onChange={(e) => handleContactChange('location', e.target.value)}
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">LinkedIn / Website / GitHub</label>
            <input
              type="text"
              value={resume.contact_info.website}
              onChange={(e) => handleContactChange('website', e.target.value)}
              placeholder="e.g. linkedin.com/in/user"
              className="w-full text-sm bg-dark-base border border-dark-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20"
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          2. Professional Summary
        </h4>
        <textarea
          value={resume.professional_summary}
          onChange={(e) => setResume(prev => ({ ...prev, professional_summary: e.target.value }))}
          className="w-full min-h-[100px] text-sm bg-dark-base border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20 resize-none"
          placeholder="Brief executive summary of your career profile..."
        />
      </div>

      {/* 3. Work Experience section */}
      <div className="space-y-6">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          3. Work Experience
        </h4>
        {resume.work_experience.map((exp, expIdx) => (
          <div key={expIdx} className="p-4 border border-dark-border rounded-2xl bg-dark-base/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Job Title</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => handleExperienceChange(expIdx, 'title', e.target.value)}
                  className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(expIdx, 'company', e.target.value)}
                  className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Dates / Location</label>
                <input
                  type="text"
                  value={exp.dates}
                  onChange={(e) => handleExperienceChange(expIdx, 'dates', e.target.value)}
                  className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
                />
              </div>
            </div>

            {/* Bullets */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider">Bullet Points</label>
              {exp.bullets.map((bullet, bulletIdx) => (
                <div key={bulletIdx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleBulletChange(expIdx, bulletIdx, e.target.value)}
                    className="flex-1 text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
                  />
                  <button
                    onClick={() => removeBullet(expIdx, bulletIdx)}
                    className="p-2 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-800"
                    title="Remove Bullet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addBullet(expIdx)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-bronze hover:text-brand-gold"
              >
                <Plus size={14} />
                Add Bullet Point
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Education section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          4. Education
        </h4>
        {resume.education.map((edu, eduIdx) => (
          <div key={eduIdx} className="p-4 border border-dark-border rounded-2xl bg-dark-base/40 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Degree / Field</label>
              <input
                type="text"
                value={`${edu.degree || ''}${edu.field ? ' in ' + edu.field : ''}`}
                onChange={(e) => {
                  const val = e.target.value;
                  const parts = val.split(' in ');
                  handleEducationChange(eduIdx, 'degree', parts[0] || '');
                  handleEducationChange(eduIdx, 'field', parts[1] || '');
                }}
                className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Institution</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-505 uppercase tracking-wider mb-1">Graduation Date</label>
              <input
                type="text"
                value={edu.dates}
                onChange={(e) => handleEducationChange(eduIdx, 'dates', e.target.value)}
                className="w-full text-xs bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-bronze"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Skills Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          5. Core Skills & Technologies
        </h4>
        <div className="flex flex-wrap gap-2.5 p-4 border border-dark-border rounded-2xl bg-dark-base/40">
          {(resume.skills || []).map((skill, index) => (
            <div key={index} className="flex items-center gap-1.5 bg-dark-panel border border-dark-border rounded-lg pl-3 pr-1 py-1 text-xs">
              <input
                type="text"
                value={skill}
                onChange={(e) => handleSkillChange(index, e.target.value)}
                className="bg-transparent font-medium text-white focus:outline-none w-28"
              />
              <button
                onClick={() => removeSkill(index)}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={addSkill}
            className="inline-flex items-center gap-1 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/20 text-brand-bronze text-xs px-3 py-2.5 rounded-lg font-bold"
          >
            <Plus size={14} />
            Add Skill
          </button>
        </div>
      </div>

      {/* 6. Certifications Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-brand-bronze pl-3">
          6. Certifications
        </h4>
        <div className="flex flex-wrap gap-2.5 p-4 border border-dark-border rounded-2xl bg-dark-base/40">
          {(resume.certifications || []).map((cert, index) => (
            <div key={index} className="flex items-center gap-1.5 bg-dark-panel border border-dark-border rounded-lg pl-3 pr-1 py-1 text-xs">
              <input
                type="text"
                value={cert}
                onChange={(e) => handleCertificationChange(index, e.target.value)}
                className="bg-transparent font-medium text-white focus:outline-none w-36"
                placeholder="e.g. AWS Certified"
              />
              <button
                onClick={() => removeCertification(index)}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={addCertification}
            className="inline-flex items-center gap-1 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/20 text-brand-bronze text-xs px-3 py-2.5 rounded-lg font-bold"
          >
            <Plus size={14} />
            Add Certification
          </button>
        </div>
      </div>

    </div>
  );
}
