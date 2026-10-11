"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AnatomicalTwinViewer } from "@/components/AnatomicalTwinViewer";
import { PatientTelemetryDeck } from "@/components/PatientTelemetryDeck";
import { DoctorComplaintsDeck } from "@/components/DoctorComplaintsDeck";
import { KaggleClinicalRAG } from "@/components/KaggleClinicalRAG";
import { BedsideCompanion } from "@/components/BedsideCompanion";
import { AICompanionAvatar } from "@/components/AICompanionAvatar";
import { OutbreakSentinel } from "@/components/OutbreakSentinel";
import { SolanaAuditTrail } from "@/components/SolanaAuditTrail";
import { SettingsModal } from "@/components/SettingsModal";
import { CrossHospitalAlertBanner } from "@/components/CrossHospitalAlertBanner";
import { SentinelState, SolanaAuditRecord } from "@/types";
import { apiUrl } from "@/lib/api";
import { useGeolocation } from "@/lib/useGeolocation";
import { Sparkles, Calendar, ChevronDown, Activity, Heart, ShieldCheck } from "lucide-react";

const INITIAL_AUDIT_RECORDS: SolanaAuditRecord[] = [
  {
    id: "audit-init-1",
    tx_signature: "5UfDZe8g9bT2Nq4m...devnet",
    slot: 284910412,
    timestamp: Date.now() - 120000,
    action_type: "KAGGLE_RAG_SYNTHESIS",
    patient_token: "ABHA-EPHEM-1002",
    doctor_identity: "DR-JENNY-WILSON",
    consent_hash: "0x89e1a3bc76d12f3490a1",
    proof_statement: "Zero PII Transferred. ABHA Consent Verified.",
    solana_explorer_url: "https://explorer.solana.com/tx/5UfDZe8g9bT2Nq4m...devnet?cluster=devnet",
  },
];

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );
  const [elevenLabsKey, setElevenLabsKey] = useState(
    process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ""
  );
  const [isAiReasoning, setIsAiReasoning] = useState(false);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [sentinelState, setSentinelState] = useState<SentinelState | null>(null);
  const [auditRecords, setAuditRecords] = useState<SolanaAuditRecord[]>(INITIAL_AUDIT_RECORDS);
  const { geoState, requestPermission: requestGpsPermission } = useGeolocation();

  // Optical Camera Pain Detection & Voice Companion States
  const [painScore, setPainScore] = useState<number>(1.6);
  const [isPainTriggered, setIsPainTriggered] = useState<boolean>(false);
  const [painTriggerCount, setPainTriggerCount] = useState<number>(0);
  const [activeSomaticTriage, setActiveSomaticTriage] = useState<any>(null);

  const handlePainScoreUpdate = (score: number) => {
    setPainScore(score);
    if (score < 7.5) {
      setIsPainTriggered(false);
    }
  };

  const handleAudioTrigger = (score: number) => {
    setPainScore(score);
    setIsPainTriggered(true);
    setPainTriggerCount((prev) => prev + 1);
  };

  // Active clinical query triggered from 3D anatomical hotspot or complaint feed
  const [activeQuery, setActiveQuery] = useState<string>(
    "a 15 year old male, pain above stomach, yellow urine, eyes becoming yellow, profound fatigue"
  );
  const [activeZone, setActiveZone] = useState<string>("LIVER");

  // Connect to SSE stream from FastAPI backend
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(apiUrl("/api/sentinel/stream"));
        eventSource.onmessage = (event) => {
          try {
            const data: SentinelState = JSON.parse(event.data);
            setSentinelState(data);
          } catch (e) {
            console.error("SSE parse error", e);
          }
        };
        eventSource.onerror = () => {
          if (eventSource) eventSource.close();
          setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn("SSE connection error", err);
      }
    };

    connectSSE();
    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleSelectHotspot = (query: string, zone: string) => {
    setActiveQuery(query);
    setActiveZone(zone);
  };

  const handleConsentMinted = (record: SolanaAuditRecord) => {
    setAuditRecords((prev) => [record, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f8] text-slate-900 font-sans flex flex-col antialiased">
      {/* 1. MediChain Omni Global Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        audioActive={isAudioSpeaking}
        aiReasoning={isAiReasoning}
        geoState={geoState}
        onRequestLocation={requestGpsPermission}
        onSearch={(q) => {
          if (q.trim()) setActiveQuery(q);
        }}
      />

      {/* 2. Main Workstation Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Real-Time Cross-Hospital 2-Week Epidemiological Outbreak Alert Banner */}
        <CrossHospitalAlertBanner alerts={sentinelState?.cross_hospital_alerts || []} />

        {/* Welcome Banner & Date Bar (Matching Screenshots 1 & 2) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              Welcome, Dr. Jenny Wilson
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Today&apos;s Clinical Overview • Federated Patient Telemetry & Kaggle Vector RAG
            </p>
          </div>

          {/* Date & Filter Controls (Matching Screenshot 1) */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#ff6332]" />
              <span>10 Oct 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD (MATCHING THE SCREENSHOTS)     */}
        {/* ======================================================== */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            {/* Top 3-Column Primary Grid (Responsive without column squeezing) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
              
              {/* Left Column: Patient Profile & Vitals Stack */}
              <div className="lg:col-span-1 xl:col-span-4">
                <PatientTelemetryDeck
                  heartRate={105}
                  bloodPressure="130/80"
                  glucoseLevel={130}
                  onSelectComplaint={(q) => setActiveQuery(q)}
                />
              </div>

              {/* Center Column: 3D Anatomical Digital Twin & Hotspots */}
              <div className="lg:col-span-1 xl:col-span-4">
                <AnatomicalTwinViewer
                  onSelectHotspot={handleSelectHotspot}
                  activeZone={activeZone}
                />
              </div>

              {/* Right Column: Attending Doctors & Complaints Feed */}
              <div className="lg:col-span-2 xl:col-span-4">
                <DoctorComplaintsDeck
                  onSelectComplaint={(q) => setActiveQuery(q)}
                />
              </div>
            </div>

            {/* Middle Section: Kaggle Healthcare RAG Workstation (Full Width) */}
            <div className="w-full">
              <KaggleClinicalRAG
                key={activeQuery}
                initialQuery={activeQuery}
                onConsentMinted={handleConsentMinted}
                onReasoningChange={setIsAiReasoning}
                geminiKey={geminiKey}
                geoState={geoState}
                onRequestLocation={requestGpsPermission}
              />
            </div>

            {/* Bedside Clinical Node Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Bedside Clinical Node (Zero-Touch Triage & Voice Companion)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      SYNCHRONIZED REALTIME
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Live Camera Pain Tracking • Multimodal Posture Triage • Autonomous Vocal Avatar</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>📹 Camera Pain AI Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-700">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>🎙️ Voice Companion Online</span>
                </div>
              </div>
            </div>

            {/* Bedside Grid: Camera Optical Pain Detection and Voice Companion alongside each other */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
              {/* Left: Camera Optical Pain Detection Node */}
              <div className="lg:col-span-7">
                <BedsideCompanion
                  onConsentMinted={handleConsentMinted}
                  onAudioTrigger={handleAudioTrigger}
                  painScore={painScore}
                  setPainScore={handlePainScoreUpdate}
                  onSomaticTriageDetected={(triage) => setActiveSomaticTriage(triage)}
                />
              </div>

              {/* Right: Dr. Maya Voice Companion Avatar alongside */}
              <div className="lg:col-span-5">
                <AICompanionAvatar
                  painScore={painScore}
                  isTriggered={isPainTriggered}
                  triggerCount={painTriggerCount}
                  onAudioStateChange={setIsAudioSpeaking}
                  elevenLabsKey={elevenLabsKey}
                  somaticTriage={activeSomaticTriage}
                />
              </div>
            </div>

            {/* Outbreak Sentinel Workstation (Full Width) */}
            <div className="w-full">
              <OutbreakSentinel
                sentinelState={sentinelState}
                onConsentMinted={handleConsentMinted}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: CAMERA OPTICAL PAIN DETECTION WORKSTATION           */}
        {/* ======================================================== */}
        {currentTab === "camera" && (
          <div className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <BedsideCompanion
                  onConsentMinted={handleConsentMinted}
                  onAudioTrigger={handleAudioTrigger}
                  painScore={painScore}
                  setPainScore={handlePainScoreUpdate}
                  onSomaticTriageDetected={(triage) => setActiveSomaticTriage(triage)}
                />
              </div>
              <div className="lg:col-span-4">
                <AICompanionAvatar
                  painScore={painScore}
                  isTriggered={isPainTriggered}
                  triggerCount={painTriggerCount}
                  onAudioStateChange={setIsAudioSpeaking}
                  elevenLabsKey={elevenLabsKey}
                  somaticTriage={activeSomaticTriage}
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DEDICATED CLINICAL RAG WORKSTATION                */}
        {/* ======================================================== */}
        {currentTab === "rag" && (
          <div className="w-full">
            <KaggleClinicalRAG
              initialQuery={activeQuery}
              onConsentMinted={handleConsentMinted}
              onReasoningChange={setIsAiReasoning}
              geminiKey={geminiKey}
              geoState={geoState}
              onRequestLocation={requestGpsPermission}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ANATOMICAL DIGITAL TWIN FULLSCREEN              */}
        {/* ======================================================== */}
        {currentTab === "anatomy" && (
          <div className="w-full">
            <AnatomicalTwinViewer
              onSelectHotspot={handleSelectHotspot}
              activeZone={activeZone}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: OUTBREAK RADAR & DBSCAN SENTINEL                  */}
        {/* ======================================================== */}
        {currentTab === "sentinel" && (
          <div className="w-full">
            <OutbreakSentinel
              sentinelState={sentinelState}
              onConsentMinted={handleConsentMinted}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ZERO-TRUST SOLANA DEVNET AUDIT TRAIL              */}
        {/* ======================================================== */}
        {currentTab === "solana" && (
          <div className="w-full">
            <SolanaAuditTrail
              auditRecords={auditRecords}
              onConsentMinted={handleConsentMinted}
            />
          </div>
        )}
      </main>

      {/* Settings Modal (API Keys & Credentials) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiKey={geminiKey}
        onSaveGeminiKey={setGeminiKey}
        elevenLabsKey={elevenLabsKey}
        onSaveElevenLabsKey={setElevenLabsKey}
      />
    </div>
  );
}
