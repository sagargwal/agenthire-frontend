// app/careers/page.tsx  —  Careers listing page
// Place at: src/app/careers/page.tsx
 
"use client";
 
import { useEffect, useState } from "react";
 
const API_BASE = "/api/proxy";
 
interface JobPosting {
  id: number;
  slug: string;
  job_title: string;
  team_key: string | null;
  level_code: string | null;
  posted_at: string;
  is_active: boolean;
}
 
// Only renders if team is not null
function TeamBadge({ team }: { team: string | null }) {
  if (!team) return null;
  const label = team.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      {label}
    </span>
  );
}
 
// Only renders if level is not null
function LevelBadge({ level }: { level: string | null }) {
  if (!level) return null;
  return (
    <span className="inline-block px-3 py-1 text-xs font-mono font-semibold rounded-full bg-gray-100 text-gray-600">
      {level}
    </span>
  );
}
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
 
export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    fetch(`${API_BASE}/careers`)
      .then((r) => r.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load job postings.");
        setLoading(false);
      });
  }, []);
 
  return (
    <div className="min-h-screen bg-gray-50">
 
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-gray-900">Nexus Health</span>
          </div>
          <span className="text-sm text-gray-500">Careers</span>
        </div>
      </header>
 
      {/* Hero */}
      <div className="bg-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-emerald-300 text-sm font-medium mb-2 uppercase tracking-wide">
            Open Roles
          </p>
          <h1 className="text-4xl font-bold mb-4">Work at Nexus Health</h1>
          <p className="text-emerald-100 text-lg max-w-xl">
            We build healthcare technology that improves lives. Every role here
            is grounded in real impact.
          </p>
        </div>
      </div>
 
      {/* Job list */}
      <main className="max-w-4xl mx-auto px-6 py-12">
 
        {loading && (
          <div className="text-center py-20 text-gray-400">
            Loading open roles…
          </div>
        )}
 
        {error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}
 
        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No open roles at the moment. Check back soon.
          </div>
        )}
 
        {!loading && !error && jobs.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-6">
              {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
            </p>
            {jobs.map((job) => (
              <a
                key={job.id}
                href={`/careers/${job.slug}`}
                className="block bg-white border border-gray-200 rounded-xl px-6 py-5 hover:border-emerald-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {job.job_title}
                    </h2>
                    {/* Only show badges if values exist */}
                    <div className="flex items-center gap-2 mt-2">
                      {job.team_key && <TeamBadge team={job.team_key} />}
                      {job.level_code && <LevelBadge level={job.level_code} />}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      Posted {formatDate(job.posted_at)}
                    </p>
                    <span className="text-emerald-600 text-sm font-medium mt-1 inline-block group-hover:underline">
                      View role →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
 
      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-gray-400">
          © 2026 Nexus Health · All roles generated by AgentHire
        </div>
      </footer>
    </div>
  );
}
 




































































































































