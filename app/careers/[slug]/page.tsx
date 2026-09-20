// app/careers/[slug]/page.tsx  —  Individual JD page
// Place at: src/app/careers/[slug]/page.tsx
 
"use client";
 
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
 
const API_BASE = "/api/proxy";
 
interface JobDetail {
  id: number;
  slug: string;
  job_title: string;
  team_key: string | null;
  level_code: string | null;
  jd_text: string;
  posted_at: string;
}
 
// ── Strip markdown syntax ─────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")  // **bold** → bold
    .replace(/\*(.*?)\*/g, "$1")       // *italic* → italic
    .replace(/^#+\s*/gm, "")           // ## heading → heading
    .replace(/_{2}(.*?)_{2}/g, "$1")   // __bold__ → bold
    .trim();
}
 
// ── Parse JD text into sections ───────────────────────────────────
function parseSections(text: string): { title: string; content: string }[] {
  const HEADERS = [
    "About Nexus Health",
    "About the Role",
    "What You Will Work On",
    "What We Are Looking For",
  ];
 
  const lines = text.split("\n");
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;
 
  for (const line of lines) {
    // Strip markdown from each line before checking
    const trimmed = stripMarkdown(line.trim());
 
    if (!trimmed) {
      if (current) current.lines.push("");
      continue;
    }
 
    // Check if this line is a section header
    const isHeader =
      HEADERS.some((h) => trimmed.startsWith(h)) ||
      trimmed.startsWith("Your Scope at");
 
    if (isHeader) {
      // Save previous section
      if (current) {
        sections.push({
          title: current.title,
          content: current.lines.join("\n").trim(),
        });
      }
      current = { title: trimmed.replace(/:$/, ""), lines: [] };
    } else if (current) {
      current.lines.push(trimmed);
    }
  }
 
  // Save last section
  if (current) {
    sections.push({
      title: current.title,
      content: current.lines.join("\n").trim(),
    });
  }
 
  // If no sections found return full text as one block
  if (sections.length === 0) {
    return [{ title: "", content: stripMarkdown(text) }];
  }
 
  return sections;
}
 
// ── Render section content ────────────────────────────────────────
function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const trimmed = line.trim();
 
    if (!trimmed) return <div key={i} className="h-2" />;
 
    // Bullet points
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <li
          key={i}
          className="ml-4 text-gray-700 text-sm leading-relaxed list-disc"
        >
          {trimmed.replace(/^[•\-\*]\s*/, "")}
        </li>
      );
    }
 
    // Plain paragraph
    return (
      <p key={i} className="text-gray-700 text-sm leading-relaxed">
        {trimmed}
      </p>
    );
  });
}
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
 
export default function JobDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
 
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/careers/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => {
        setError("This role could not be found.");
        setLoading(false);
      });
  }, [slug]);
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }
 
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || "Role not found."}</p>
        <a href="/careers" className="text-emerald-600 text-sm hover:underline">
          ← Back to all roles
        </a>
      </div>
    );
  }
 
  const sections = parseSections(job.jd_text);
 
  return (
    <div className="min-h-screen bg-gray-50">
 
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-gray-900">Nexus Health</span>
          </div>
          <a
            href="/careers"
            className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            ← All roles
          </a>
        </div>
      </header>
 
      {/* Job hero */}
      <div className="bg-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-4">
            {/* Only show level badge if level exists */}
            {job.level_code && (
              <span className="px-3 py-1 text-xs font-mono font-semibold rounded-full bg-emerald-900 text-emerald-300">
                {job.level_code}
              </span>
            )}
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-900 text-emerald-300">
              Full-time
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{job.job_title}</h1>
          <p className="text-emerald-300 text-sm">
            Posted {formatDate(job.posted_at)} · Nexus Health
          </p>
        </div>
      </div>
 
      {/* JD content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`px-8 py-7 ${
                i < sections.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              {/* Section heading */}
              {section.title && (
                <h2 className="text-base font-semibold text-emerald-800 mb-4">
                  {section.title}
                </h2>
              )}
              {/* Section content */}
              <ul className="space-y-1">
                {renderContent(section.content)}
              </ul>
            </div>
          ))}
        </div>
 
        {/* Apply CTA */}
        <div className="mt-8 bg-emerald-800 rounded-xl px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Interested in this role?</p>
            <p className="text-emerald-300 text-sm mt-1">
              Send your CV to careers@nexushealth.com
            </p>
          </div>
          <a
            href={`mailto:careers@nexushealth.com?subject=Application — ${job.job_title}`}
            className="bg-white text-emerald-800 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors shrink-0"
          >
            Apply now
          </a>
        </div>
 
        <p className="text-center text-xs text-gray-400 mt-8">
          This job description was generated by AgentHire · Nexus Health © 2026
        </p>
      </main>
    </div>
  );
}
 