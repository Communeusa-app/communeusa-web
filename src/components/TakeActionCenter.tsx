"use client";

import { useState } from "react";
import type { OfficialProfile } from "@/app/actions/officials";

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "position",
    label: "Position inquiry",
    text: "I'm a constituent in [your district]. I'm writing about [issue]. I'd like to understand your position on [specific bill or vote] and what you plan to do about it.\n\n— [Your name], [Your address]",
  },
  {
    id: "concern",
    label: "Constituent concern",
    text: "As a resident you represent, I want to share that [issue] matters to me. Can you tell me where you stand and how you intend to vote?\n\n— [Your name], [Your address]",
  },
  {
    id: "meeting",
    label: "Meeting request",
    text: "My name is [your name] and I live in [your city or district]. I am following [specific bill or vote] and would like to request a brief meeting or call with your office to discuss it. I can be reached at [your phone or email].\n\n— [Your name], [Your address]",
  },
] as const;

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolHeader({
  label,
  description,
  isOpen,
  onToggle,
}: {
  label: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-brand-light-gray/20 dark:hover:bg-brand-dark-gray/40 transition-colors"
    >
      <div>
        <span className="text-sm font-semibold text-brand-navy dark:text-brand-off-white tracking-wide">
          {label}
        </span>
        <span className="ml-2.5 text-xs text-brand-navy/45 dark:text-brand-off-white/40">
          {description}
        </span>
      </div>
      <span className="shrink-0 text-brand-navy/40 dark:text-brand-off-white/40">
        <ChevronIcon open={isOpen} />
      </span>
    </button>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-brand-primary dark:text-brand-red hover:opacity-75 transition-opacity underline underline-offset-2 text-sm"
    >
      {children}
      <ArrowUpRightIcon />
    </a>
  );
}

function InfoRow({ icon, label, value, href, hrefLabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-brand-navy/40 dark:text-brand-off-white/35">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-brand-navy dark:text-brand-off-white">
          {value}
        </p>
        {href && (
          <a
            href={href}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-primary dark:text-brand-red hover:opacity-75 transition-opacity"
          >
            {hrefLabel ?? href}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getTestimonyContent(official: OfficialProfile): {
  body: string;
  links: { label: string; href: string }[];
} {
  const level = official.level.toLowerCase();
  const website = official.official_website ? normalizeUrl(official.official_website) : null;

  if (level === "state") {
    return {
      body:
        "Washington state legislators vote on bills in the House and Senate. You can testify in person or remotely on bills that are scheduled for a public hearing. Check the WA Legislature bill tracker to find upcoming hearings, then register to provide testimony.",
      links: [
        { label: "WA Legislature bill tracker", href: "https://app.leg.wa.gov/billinfo" },
        { label: "Remote testimony registration (CSI)", href: "https://app.leg.wa.gov/csi/" },
      ],
    };
  }

  if (level === "city") {
    return {
      body:
        "City councils hold regular public meetings where residents can give public comment. Check the city's official website for the meeting calendar, agenda, and instructions on signing up for public comment. Most councils allow 2–3 minutes per speaker.",
      links: website
        ? [{ label: "Official city website", href: website }]
        : [],
    };
  }

  if (level === "county") {
    return {
      body:
        "County councils and boards of commissioners hold public meetings where residents may address the body during public comment periods. Check the county's official website for the meeting schedule and agenda, and to find out how to sign up to speak.",
      links: website
        ? [{ label: "Official county website", href: website }]
        : [],
    };
  }

  return {
    body:
      "Federal officials do not typically have a local public comment forum you can attend, but you can submit written testimony or a statement for the record to relevant congressional committees. Contact the official's district office for information about town halls or constituent meetings.",
    links: website ? [{ label: "Official website", href: website }] : [],
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  official: OfficialProfile;
  upcomingElectionDate: string | null;
}

type ToolId = "contact" | "vote" | "testify" | "recall";

// ── Component ─────────────────────────────────────────────────────────────────

export function TakeActionCenter({ official, upcomingElectionDate }: Props) {
  const [open, setOpen] = useState<Record<ToolId, boolean>>({
    contact: false,
    vote: false,
    testify: false,
    recall: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);

  function toggleTool(id: ToolId) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(TEMPLATES[selectedTemplate].text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // browser may block clipboard without HTTPS or user gesture
    }
  }

  const mailtoHref = official.email
    ? `mailto:${official.email}?subject=${encodeURIComponent("Message from a Constituent")}&body=${encodeURIComponent(TEMPLATES[selectedTemplate].text)}`
    : null;

  const testimony = getTestimonyContent(official);

  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-brand-light-gray/60 dark:border-brand-dark-gray/60">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40">
          Take Action
        </h2>
      </div>

      <div className="divide-y divide-brand-light-gray/60 dark:divide-brand-dark-gray/60">

        {/* ── 1. CONTACT ──────────────────────────────────────────────────── */}
        <ToolHeader
          label="Contact"
          description="Phone, email, and message templates"
          isOpen={open.contact}
          onToggle={() => toggleTool("contact")}
        />
        {open.contact && (
          <div className="px-6 py-5 space-y-6 bg-brand-light-gray/10 dark:bg-brand-charcoal/30">

            {/* Contact details */}
            <div className="space-y-3">
              {official.phone && (
                <InfoRow
                  icon={<PhoneIcon />}
                  label="Phone"
                  value={official.phone}
                  href={`tel:${official.phone.replace(/\D/g, "")}`}
                  hrefLabel={`Call ${official.phone}`}
                />
              )}
              {official.email && (
                <InfoRow
                  icon={<MailIcon />}
                  label="Email"
                  value={official.email}
                />
              )}
              {!official.phone && !official.email && (
                <div className="space-y-3">
                  <p className="text-sm text-brand-navy/65 dark:text-brand-off-white/55">
                    Direct contact details for this official aren&apos;t on file yet.
                  </p>
                  {official.official_website && (
                    <a
                      href={normalizeUrl(official.official_website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray hover:bg-brand-light-blue/20 dark:hover:bg-brand-red/10 hover:border-brand-primary/40 dark:hover:border-brand-red/40 px-3.5 py-2 text-sm font-medium text-brand-navy dark:text-brand-off-white transition-all duration-150"
                    >
                      Visit their office website
                      <ArrowUpRightIcon />
                    </a>
                  )}
                  {official.jurisdiction_name && (
                    <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/45">
                      You can also reach their office through the{" "}
                      <span className="font-medium text-brand-navy/75 dark:text-brand-off-white/65">
                        {official.jurisdiction_name}
                      </span>{" "}
                      government.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Message templates */}
            <div data-action-variant="template" className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40">
                Message templates
              </p>
              <p className="text-xs text-brand-navy/55 dark:text-brand-off-white/50 leading-relaxed">
                Select a template, fill in the <span className="font-semibold text-brand-navy/70 dark:text-brand-off-white/65">[bracketed]</span> fields, then copy or open in your mail client.
              </p>

              {/* Template selector */}
              <div className="space-y-2">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(i)}
                    className={`w-full text-left rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-150 ${
                      selectedTemplate === i
                        ? "border-brand-primary dark:border-brand-red bg-brand-light-blue/20 dark:bg-brand-red/10 text-brand-navy dark:text-brand-off-white"
                        : "border-brand-light-gray dark:border-brand-dark-gray text-brand-navy/65 dark:text-brand-off-white/55 hover:border-brand-primary/40 dark:hover:border-brand-red/40 hover:bg-brand-light-blue/10 dark:hover:bg-brand-red/5"
                    }`}
                  >
                    <span className="block font-medium text-[11px] uppercase tracking-wider mb-1 opacity-60">
                      {t.label}
                    </span>
                    {t.text}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray hover:bg-brand-light-blue/20 dark:hover:bg-brand-red/10 hover:border-brand-primary/40 dark:hover:border-brand-red/40 px-3.5 py-2 text-sm font-medium text-brand-navy dark:text-brand-off-white transition-all duration-150"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied!" : "Copy template"}
                </button>

                {mailtoHref && (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary dark:bg-brand-red hover:bg-brand-navy dark:hover:bg-brand-red/80 px-3.5 py-2 text-sm font-medium text-white transition-colors"
                  >
                    <MailIcon />
                    Open in mail app
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 2. VOTE ─────────────────────────────────────────────────────── */}
        <ToolHeader
          label="Vote"
          description="Upcoming elections and registration"
          isOpen={open.vote}
          onToggle={() => toggleTool("vote")}
        />
        {open.vote && (
          <div className="px-6 py-5 space-y-4 bg-brand-light-gray/10 dark:bg-brand-charcoal/30">
            <div className="rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1">
                Next election
              </p>
              <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">
                {upcomingElectionDate ? formatDate(upcomingElectionDate) : "No upcoming election on file"}
              </p>
            </div>

            <p className="text-sm text-brand-navy/65 dark:text-brand-off-white/55 leading-relaxed">
              The most direct way to hold any official accountable is at the ballot box.
            </p>

            <ExternalLink href="https://voter.votewa.gov">
              Register to vote / check your registration
            </ExternalLink>
          </div>
        )}

        {/* ── 3. TESTIFY ──────────────────────────────────────────────────── */}
        <ToolHeader
          label="Testify"
          description="Give public comment at official meetings"
          isOpen={open.testify}
          onToggle={() => toggleTool("testify")}
        />
        {open.testify && (
          <div className="px-6 py-5 space-y-4 bg-brand-light-gray/10 dark:bg-brand-charcoal/30">
            <p className="text-sm text-brand-navy/75 dark:text-brand-off-white/70 leading-relaxed">
              {testimony.body}
            </p>

            {testimony.links.length > 0 && (
              <div className="space-y-2">
                {testimony.links.map((link) => (
                  <div key={link.href}>
                    <ExternalLink href={link.href}>{link.label}</ExternalLink>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 4. RECALL INFORMATION ───────────────────────────────────────── */}
        <ToolHeader
          label="Recall Information"
          description="Understanding the legal recall process"
          isOpen={open.recall}
          onToggle={() => toggleTool("recall")}
        />
        {open.recall && (
          <div className="px-6 py-5 space-y-5 bg-brand-light-gray/10 dark:bg-brand-charcoal/30">
            <div className="rounded-lg border border-brand-light-gray/80 dark:border-brand-dark-gray bg-brand-off-white dark:bg-brand-charcoal px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1">
                Educational information only
              </p>
              <p className="text-xs text-brand-navy/60 dark:text-brand-off-white/50 leading-relaxed">
                The following is a factual summary of Washington state law. It is not legal advice. Recall is a serious legal process with specific statutory requirements.
              </p>
            </div>

            <div className="space-y-3 text-sm text-brand-navy/75 dark:text-brand-off-white/70 leading-relaxed">
              <p>
                Washington state allows voters to petition for the recall of certain public officials under{" "}
                <ExternalLink href="https://app.leg.wa.gov/rcw/default.aspx?cite=29A.56">
                  RCW 29A.56.110–29A.56.270
                </ExternalLink>
                . The law sets a high legal standard: a recall petition must allege{" "}
                <strong className="font-semibold text-brand-navy dark:text-brand-off-white">malfeasance, misfeasance, or violation of the oath of office</strong>
                {" "}— not mere policy disagreement or dissatisfaction with an official&apos;s decisions.
              </p>

              <p>
                Before any signature gathering may begin, a superior court judge reviews the petition to determine whether the stated charges are legally and factually sufficient under the statute. Petitions that fail this standard are dismissed.
              </p>

              <div className="rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-3.5 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1">
                  Signature thresholds
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-brand-primary/50 dark:bg-brand-red/50 shrink-0" />
                    <p>
                      <strong className="font-semibold text-brand-navy dark:text-brand-off-white">State officials:</strong>{" "}
                      25% of votes cast for that office in the last general election
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-brand-primary/50 dark:bg-brand-red/50 shrink-0" />
                    <p>
                      <strong className="font-semibold text-brand-navy dark:text-brand-off-white">Most local officials:</strong>{" "}
                      35% of votes cast for that office in the last general election
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-brand-navy/60 dark:text-brand-off-white/50 text-xs leading-relaxed border-t border-brand-light-gray/60 dark:border-brand-dark-gray/60 pt-3">
                This section provides educational context about how the recall process works under Washington law. It is not legal advice. If you believe an official has committed an act that meets the statutory standard, consult a licensed attorney about your options.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
