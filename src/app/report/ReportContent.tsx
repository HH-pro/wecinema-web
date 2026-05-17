"use client";

import { useState, useCallback } from "react";
import emailjs from "emailjs-com";

const REPORT_CATEGORIES = ["Spam", "Harassment", "Misinformation", "Hate Speech", "Other"] as const;

const EMAILJS = {
  serviceId: "service_zqol7n4",
  templateId: "template_mdpiipr",
  publicKey: "1r7HTd-O6zTnCC-J-",
  ownerEmail: "hamzamanzoor046@gmail.com",
} as const;

export default function ReportContent() {
  const [reportData, setReportData] = useState({ category: "", details: "" });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
      setReportData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      try {
        await emailjs.send(
          EMAILJS.serviceId,
          EMAILJS.templateId,
          { category: reportData.category, details: reportData.details, owner_email: EMAILJS.ownerEmail },
          EMAILJS.publicKey
        );
        setMessage("Report sent successfully! We'll review it shortly.");
        setIsSuccess(true);
        setReportData({ category: "", details: "" });
      } catch {
        setMessage("Failed to send report. Please try again.");
        setIsSuccess(false);
      } finally {
        setSending(false);
      }
    },
    [reportData]
  );

  return (
    <div className="min-h-screen bg-bg-tertiary px-4 py-10 flex justify-center items-start">
      <div
        className="w-full max-w-[520px] bg-bg-elevated rounded-[20px] border border-border-secondary p-8"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        <h2 className="text-[22px] font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Report Content
        </h2>
        <p className="text-sm text-text-tertiary mb-6">Help us keep WeCinema safe by reporting inappropriate content.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="report-category" className="block text-[13px] font-semibold text-text-secondary mb-1.5">
              Reason for Reporting
            </label>
            <select
              id="report-category"
              name="category"
              value={reportData.category}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-text-primary outline-none transition-all appearance-none"
              style={{
                border: "1px solid var(--color-input-border)",
                backgroundColor: "var(--color-input-bg)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%23909090' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px color-mix(in srgb, var(--color-accent-primary) 20%, transparent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-input-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">Select a reason</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-details" className="block text-[13px] font-semibold text-text-secondary mb-1.5">
              Additional Details
            </label>
            <textarea
              id="report-details"
              name="details"
              value={reportData.details}
              onChange={handleChange}
              placeholder="Provide more information about what you're reporting..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-text-primary outline-none resize-y min-h-[120px] transition-all leading-relaxed"
              style={{
                border: "1px solid var(--color-input-border)",
                backgroundColor: "var(--color-input-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px color-mix(in srgb, var(--color-accent-primary) 20%, transparent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-input-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-danger)" }}
          >
            {sending ? "Sending…" : "Submit Report"}
          </button>
        </form>

        {message && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-[13px] font-medium text-center"
            style={{
              backgroundColor: isSuccess ? "var(--color-success-bg)" : "var(--color-danger-bg)",
              color: isSuccess ? "var(--color-success)" : "var(--color-danger)",
              border: `1px solid color-mix(in srgb, ${isSuccess ? "var(--color-success)" : "var(--color-danger)"} 20%, transparent)`,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
