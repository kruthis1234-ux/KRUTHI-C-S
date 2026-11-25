import { ArrowUpRight, Copy, Github, Linkedin, Mail, MapPin, Send } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { isSafeHttpUrl } from '../lib/formatters';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ContactPage() {
  const { snapshot, notify } = usePortfolio();
  const settings = snapshot?.settings;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useDocumentTitle('Contact — ProjectVerse', 'Connect via email, GitHub, or LinkedIn.');

  const email = settings?.email || 'kruthi0415@gmail.com';
  const hasGithub = settings?.githubUrl && isSafeHttpUrl(settings.githubUrl);
  const hasLinkedin = settings?.linkedinUrl && isSafeHttpUrl(settings.linkedinUrl);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      notify('success', `Copied ${email} to clipboard.`);
    } catch {
      notify('info', `Email address: ${email}`);
    }
  }

  function handleSendMailto(e: React.FormEvent) {
    e.preventDefault();
    const mailSubject = encodeURIComponent(subject.trim() || 'ProjectVerse Inquiry');
    const mailBody = encodeURIComponent(message.trim());
    window.location.href = `mailto:${email}?subject=${mailSubject}&body=${mailBody}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="space-y-2 max-w-2xl">
        <p className="text-xs font-medium text-sky-700 dark:text-sky-400">Contact</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950 dark:text-white">
          Get in Touch
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300">
          Interested in collaborating on a software project, discussing an engineering opportunity, or asking about a repository inside ProjectVerse?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Direct Contact Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-display font-bold text-stone-900 dark:text-white">Direct Email</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 text-xs text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>

            <p className="font-mono text-sm text-stone-800 dark:text-slate-200 break-all">{email}</p>

            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold hover:opacity-90"
            >
              <Mail className="w-4 h-4" />
              <span>Open Email Client</span>
            </a>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-3">
            <h2 className="font-display font-bold text-stone-900 dark:text-white">Developer Profiles</h2>
            <div className="space-y-2.5">
              {hasGithub ? (
                <a
                  href={settings!.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-sm font-medium text-stone-800 dark:text-slate-200 transition-colors"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Github className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>GitHub Profile</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 text-xs text-stone-500 dark:text-slate-400 flex items-center justify-between">
                  <span>GitHub URL not set yet</span>
                  <Link to="/admin" className="text-emerald-700 dark:text-emerald-400 hover:underline">
                    Set in Admin
                  </Link>
                </div>
              )}

              {hasLinkedin ? (
                <a
                  href={settings!.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-sm font-medium text-stone-800 dark:text-slate-200 transition-colors"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Linkedin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>LinkedIn Profile</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 text-xs text-stone-500 dark:text-slate-400 flex items-center justify-between">
                  <span>LinkedIn URL not set yet</span>
                  <Link to="/admin" className="text-emerald-700 dark:text-emerald-400 hover:underline">
                    Set in Admin
                  </Link>
                </div>
              )}
            </div>

            {settings?.location && (
              <div className="pt-2 flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{settings.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Email Composer */}
        <form
          onSubmit={handleSendMailto}
          className="lg:col-span-7 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              Compose a Quick Note
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Prepares a pre-addressed email directly to {email}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-subject" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Collaboration, internship opportunity, or project feedback"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={6}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white resize-y"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-violet-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Launch Email Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
