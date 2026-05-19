"use client";

import { useState, useEffect } from "react";
import { submitCorrection } from "@/app/actions/corrections";

// ── Field options by entity type ──────────────────────────────────────────────

const FIELD_OPTIONS: Record<string, string[]> = {
  official: [
    "Name", "Party", "Office Title", "District", "Term Start", "Term End",
    "Phone", "Email", "Website", "Key Committees", "Notes", "Other",
  ],
  election: ["Office Name", "Election Date", "Election Type", "Jurisdiction", "Status", "Other"],
  candidate: ["Name", "Party", "Website", "Campaign Statement", "Endorsements", "Other"],
  law_enforcement: [
    "Agency Name", "Chief / Sheriff", "Phone", "Website", "Headquarters", "Sworn Officers", "Other",
  ],
  school_district: ["District Name", "Superintendent", "Phone", "Website", "Enrollment", "Other"],
  hospital: [
    "Hospital Name", "CEO", "Phone", "Website", "Beds", "Trauma Level", "Health System", "Other",
  ],
  fire_ems: ["Agency Name", "Fire Chief", "Phone", "Website", "Stations", "Personnel", "Other"],
  state_agency: ["Agency Name", "Director Name", "Phone", "Website", "Mission Summary", "Other"],
  judiciary: ["Judge Name", "Court Name", "Position", "Term Start", "Term End", "Other"],
  utilities_transit: ["Name", "Director", "Phone", "Website", "Other"],
  rights_content: [
    "Incorrect Statute / Citation", "Outdated Information",
    "Missing Right or Exemption", "Wrong Case Name", "Other",
  ],
  general: [
    "Missing information", "Incorrect information", "Outdated information",
    "Broken link", "Other",
  ],
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function FlagIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  entityType: string;
  entityId?: string;
  entityName?: string;
  variant?: "button" | "footer-link";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CorrectionModal({
  entityType,
  entityId,
  entityName,
  variant = "button",
}: Props) {
  const [open, setOpen]                 = useState(false);
  const [fieldName, setFieldName]       = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [suggested, setSuggested]       = useState("");
  const [reason, setReason]             = useState("");
  const [sourceUrl, setSourceUrl]       = useState("");
  const [email, setEmail]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const fields = FIELD_OPTIONS[entityType] ?? FIELD_OPTIONS.general;

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setErrorMsg(null);
      setFieldName(""); setCurrentValue(""); setSuggested("");
      setReason(""); setSourceUrl(""); setEmail("");
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggested.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    const result = await submitCorrection({
      entity_type:     entityType,
      entity_id:       entityId,
      entity_name:     entityName,
      field_name:      fieldName   || undefined,
      current_value:   currentValue || undefined,
      suggested_value: suggested,
      reason:          reason      || undefined,
      source_url:      sourceUrl   || undefined,
      submitter_email: email       || undefined,
    });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setErrorMsg(result.error);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 transition";

  const labelCls =
    "block text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1.5";

  return (
    <>
      {/* ── Trigger ──────────────────────────────────────────────────────── */}
      {variant === "button" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-brand-navy/45 dark:text-brand-off-white/40 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
        >
          <FlagIcon />
          Suggest a correction
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-brand-navy/35 dark:text-brand-off-white/30 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
        >
          Suggest a correction
        </button>
      )}

      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/65 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl bg-brand-off-white dark:bg-brand-charcoal border border-brand-light-gray/70 dark:border-brand-dark-gray shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light-gray/60 dark:border-brand-dark-gray shrink-0">
              <div>
                <h2 className="text-base font-semibold text-brand-navy dark:text-brand-off-white">
                  Suggest a Correction
                </h2>
                {entityName && (
                  <p className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 mt-0.5 truncate">
                    {entityName}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="shrink-0 ml-4 text-brand-navy/40 dark:text-brand-off-white/40 hover:text-brand-navy dark:hover:text-brand-off-white transition-colors"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto">
              {success ? (
                /* ── Success state ────────────────────────────────────────── */
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-brand-light-blue/30 dark:bg-brand-primary/20 flex items-center justify-center mx-auto mb-4 text-brand-primary dark:text-brand-light-blue">
                    <CheckCircleIcon />
                  </div>
                  <h3 className="text-base font-semibold text-brand-navy dark:text-brand-off-white mb-2">
                    Correction submitted
                  </h3>
                  <p className="text-sm text-brand-navy/60 dark:text-brand-off-white/55 mb-6 leading-relaxed">
                    Thank you — our team will review your suggestion and update the
                    record if it checks out.
                  </p>
                  <button
                    onClick={handleClose}
                    className="rounded-xl bg-brand-primary hover:bg-brand-navy dark:bg-brand-red dark:hover:bg-brand-red/80 text-white font-semibold px-6 py-2.5 text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* ── Form ─────────────────────────────────────────────────── */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* What is wrong */}
                  <div>
                    <label className={labelCls}>What is wrong?</label>
                    <select
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a field…</option>
                      {fields.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Current value */}
                  <div>
                    <label className={labelCls}>
                      What it currently says{" "}
                      <span className="normal-case font-normal text-brand-navy/35 dark:text-brand-off-white/30">
                        — optional
                      </span>
                    </label>
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="Current value…"
                      className={inputCls}
                    />
                  </div>

                  {/* Suggested value */}
                  <div>
                    <label className={labelCls}>
                      What it should say{" "}
                      <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={suggested}
                      onChange={(e) => setSuggested(e.target.value)}
                      placeholder="Correct value…"
                      required
                      className={inputCls}
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className={labelCls}>
                      Reason{" "}
                      <span className="normal-case font-normal text-brand-navy/35 dark:text-brand-off-white/30">
                        — optional
                      </span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this incorrect or outdated?"
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Source URL */}
                  <div>
                    <label className={labelCls}>
                      Source URL{" "}
                      <span className="normal-case font-normal text-brand-navy/35 dark:text-brand-off-white/30">
                        — link to official source
                      </span>
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://official-source.gov/…"
                      className={inputCls}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelCls}>
                      Your email{" "}
                      <span className="normal-case font-normal text-brand-navy/35 dark:text-brand-off-white/30">
                        — optional, for follow-up
                      </span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-brand-red">{errorMsg}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 rounded-xl border border-brand-light-gray dark:border-brand-dark-gray px-4 py-2.5 text-sm font-medium text-brand-navy/60 dark:text-brand-off-white/55 hover:bg-brand-light-gray/30 dark:hover:bg-brand-dark-gray/60 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !suggested.trim()}
                      className="flex-1 rounded-xl bg-brand-primary hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-red dark:hover:bg-brand-red/80 text-white font-semibold px-4 py-2.5 text-sm transition-colors"
                    >
                      {loading ? "Submitting…" : "Submit correction"}
                    </button>
                  </div>

                  <p className="text-[11px] text-brand-navy/35 dark:text-brand-off-white/30 leading-relaxed">
                    Corrections are reviewed by our editorial team. We will not publish
                    your email address.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
