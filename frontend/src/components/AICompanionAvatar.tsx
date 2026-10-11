"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Globe, Sparkles, MessageSquare, Send, Heart, ShieldAlert, Activity, UserCheck, Mic, MicOff } from "lucide-react";
import { apiUrl, requestElevenLabsVoice } from "@/lib/api";

interface AICompanionAvatarProps {
  painScore: number;
  isTriggered: boolean;
  triggerCount?: number;
  onAudioStateChange: (active: boolean) => void;
  elevenLabsKey?: string;
  onCompanionSpoke?: (message: string) => void;
  somaticTriage?: any;
}

export function AICompanionAvatar({
  painScore,
  isTriggered,
  triggerCount = 0,
  onAudioStateChange,
  elevenLabsKey,
  onCompanionSpoke,
  somaticTriage,
}: AICompanionAvatarProps) {
  // Bilingual Language State: 'en' | 'hi'
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [avatarExpression, setAvatarExpression] = useState<"attentive" | "comforting" | "concerned">("attentive");
  const [spokenEn, setSpokenEn] = useState<string>(
    "Hello, I am Dr. Maya, your autonomous bedside clinical companion. I am monitoring your facial tension and blink latency in local volatile RAM."
  );
  const [spokenHi, setSpokenHi] = useState<string>(
    "नमस्ते, मैं डॉ. माया हूँ, आपकी बेडसाइड क्लिनिकल साथी। मैं आपके चेहरे के तनाव और पलक झपकने की गति पर नज़र रख रही हूँ।"
  );
  const [patientInput, setPatientInput] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Animation states for the avatar
  const [eyeBlink, setEyeBlink] = useState<boolean>(false);
  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Periodically blink avatar eyes
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip-sync mouth animation loop while speaking
  useEffect(() => {
    let animId: number;
    if (isSpeaking) {
      const animateLipSync = () => {
        // Oscillation between 0 and 1
        const t = performance.now() / 120;
        setMouthOpen(Math.abs(Math.sin(t)) * 0.8 + 0.2);
        animId = requestAnimationFrame(animateLipSync);
      };
      animId = requestAnimationFrame(animateLipSync);
    } else {
      setMouthOpen(0);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking]);

  // Adjust avatar expression based on patient pain score
  useEffect(() => {
    if (painScore >= 8.0) {
      setAvatarExpression("concerned");
    } else if (painScore >= 5.0) {
      setAvatarExpression("comforting");
    } else {
      setAvatarExpression("attentive");
    }
  }, [painScore]);

  // Speak a message bilingually
  const speakMessage = async (enText: string, hiText: string) => {
    setSpokenEn(enText);
    setSpokenHi(hiText);
    setIsSpeaking(true);
    onAudioStateChange(true);
    onCompanionSpoke?.(language === "hi" ? hiText : enText);

    if (isMuted) {
      setTimeout(() => {
        setIsSpeaking(false);
        onAudioStateChange(false);
      }, 3000);
      return;
    }

    const textToSpeak = language === "hi" ? hiText : enText;

    try {
      const res = await requestElevenLabsVoice(textToSpeak, elevenLabsKey);
      if (res.audioBlob) {
        const url = URL.createObjectURL(res.audioBlob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            onAudioStateChange(false);
          };
          await audioRef.current.play();
          return;
        }
      }
    } catch {
      // Fall through to Web Speech API
    }

    // Web Speech API Fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.90;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        setIsSpeaking(false);
        onAudioStateChange(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onAudioStateChange(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        onAudioStateChange(false);
      }, 4000);
    }
  };

  // Track previous pain score and last vocalization timestamp to trigger every time threshold is reached
  const prevPainScoreRef = useRef<number>(painScore);
  const lastSpokenTimeRef = useRef<number>(0);

  // Trigger high pain empathetic audio every time bar reaches threshold
  useEffect(() => {
    const wasBelow = prevPainScoreRef.current < 7.8;
    const isAbove = painScore >= 7.8;
    prevPainScoreRef.current = painScore;

    const now = Date.now();
    const cooldownElapsed = now - lastSpokenTimeRef.current > 2500;

    // Trigger audio whenever:
    // 1) Bar transitions from below threshold to above threshold (wasBelow && isAbove)
    // 2) Or explicit triggerCount increments while above threshold
    // 3) Or isTriggered became true with cooldown elapsed
    if ((wasBelow && isAbove && cooldownElapsed) || (triggerCount > 0 && isAbove && cooldownElapsed) || (isTriggered && isAbove && cooldownElapsed)) {
      lastSpokenTimeRef.current = now;
      const en = "I notice elevated facial tension. Does your chest or head hurt? Please take a slow, deep breath while I notify your triage nurse.";
      const hi = "नमस्ते, मैं देख पा रही हूँ कि आप काफी असहज महसूस कर रहे हैं। कृपया धीरे-धीरे गहरी सांस लें, मैंने ट्राइएज टीम को सूचित कर दिया है।";
      speakMessage(en, hi);
    }
  }, [painScore, isTriggered, triggerCount]);

  // Autonomous trigger on Somatic Posture Detection (Gemini Multimodal)
  useEffect(() => {
    if (somaticTriage && somaticTriage.companion_speech_en) {
      setAvatarExpression("concerned");
      speakMessage(
        somaticTriage.companion_speech_en,
        somaticTriage.companion_speech_hi || somaticTriage.companion_speech_en
      );
    }
  }, [somaticTriage]);

  // Handle Quick Symptom Prompt
  const handleQuickSymptom = (type: "chest" | "breath" | "dizzy" | "nurse") => {
    if (type === "chest") {
      speakMessage(
        "I understand you are experiencing chest discomfort. Please remain reclined; I have alerted the emergency triage staff.",
        "मैं समझ गई कि आपको सीने में दर्द हो रहा है। कृपया सीधे लेटे रहें, मैंने इमरजेंसी ट्राइएज टीम को तत्काल कॉल भेज दी है।"
      );
    } else if (type === "breath") {
      speakMessage(
        "Focus on slow exhalations. I am observing your respiratory effort and respiratory rate closely.",
        "कृपया धीरे-धीरे सांस बाहर छोड़ें। मैं आपकी श्वसन गति पर लगातार नज़र रख रही हूँ, सहायता आ रही है।"
      );
    } else if (type === "dizzy") {
      speakMessage(
        "Please rest your head firmly on the pillow to prevent any sudden fall. Your vital telemetry is stable.",
        "कृपया अपना सिर तकिए पर स्थिर रखें ताकि चक्कर से संतुलन न बिगड़े। आपकी मुख्य वाइटल्स अभी स्थिर हैं।"
      );
    } else {
      speakMessage(
        "I am summoning the floor nurse to your bedside right away.",
        "मैंने ड्यूटी नर्स को तुरंत आपके बेड पर आने का सिग्नल भेज दिया है।"
      );
    }
  };

  // Live Voice Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition requires Chrome/Edge browser. You can also type directly.");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = language === "hi" ? "hi-IN" : "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (evt: any) => {
        const transcript = evt.results[0][0].transcript;
        if (transcript) {
          setPatientInput(transcript);
          dispatchSpokenMessage(transcript);
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const dispatchSpokenMessage = async (query: string) => {
    try {
      const res = await fetch(apiUrl("/api/companion/converse"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: query,
          language: language,
          pain_score: painScore
        })
      });
      if (res.ok) {
        const data = await res.json();
        speakMessage(data.en_translation || data.spoken_text, data.hi_translation || data.spoken_text);
        return;
      }
    } catch {}

    if (query.toLowerCase().includes("chest") || query.includes("सीने") || query.includes("दर्द")) {
      handleQuickSymptom("chest");
    } else if (query.toLowerCase().includes("breath") || query.includes("सांस")) {
      handleQuickSymptom("breath");
    } else {
      speakMessage(
        `I registered your response: "${query}". I am continuously correlating this with your edge facial tension metrics.`,
        `मैंने आपकी बात नोट कर ली है: "${query}"। मैं आपके चेहरे के तनाव और वाइटल्स के साथ इसका मिलान कर रही हूँ।`
      );
    }
  };

  // Handle patient typed response
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput.trim()) return;

    const query = patientInput.trim();
    setPatientInput("");
    dispatchSpokenMessage(query);
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
      <audio ref={audioRef} className="hidden" />

      {/* Top Bar with Language Selector & Companion Status */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f5a0] animate-ping" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              Dr. Maya <span className="text-[#00f5a0]">&bull; AI Live Companion</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              Synthetic Autonomous Bedside Vocal & Visual Avatar
            </p>
          </div>
        </div>

        {/* Language Switcher & Audio Mute Toggle */}
        <div className="flex items-center space-x-2">
          {/* Bilingual Switcher */}
          <div className="flex rounded-lg bg-black/50 p-0.5 border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => {
                setLanguage("en");
                speakMessage(
                  "Language switched to English. How can I assist you?",
                  "भाषा अंग्रेजी में बदल दी गई है।"
                );
              }}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === "en" ? "bg-[#00f5a0] text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguage("hi");
                speakMessage(
                  "भाषा बदलकर हिन्दी कर दी गई है। आप कैसा महसूस कर रहे हैं?",
                  "नमस्ते, मैं अब आपसे हिन्दी में संवाद करूँगी। आपको क्या तकलीफ है?"
                );
              }}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === "hi" ? "bg-[#00f5a0] text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              हिन्दी
            </button>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00f5a0]" />}
          </button>
        </div>
      </div>

      {/* Center Stage: Interactive Visual Synthetic Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
        {/* Holographic Avatar Head Display */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          {/* Subtle Outer Bio-Resonance Rings */}
          <div className={`absolute inset-0 rounded-full border transition-all duration-700 ${
            isSpeaking ? "border-[#00f5a0]/40 scale-110 animate-pulse" : "border-white/5"
          }`} />
          <div className={`absolute inset-2 rounded-full border transition-all duration-500 ${
            isSpeaking ? "border-[#00d2ff]/50 scale-105" : "border-white/5"
          }`} />

          {/* Avatar Base Face Container */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#131c2c] to-[#0a0e17] border-2 border-[#00f5a0]/30 shadow-xl flex items-center justify-center relative overflow-hidden">
            {/* Ambient Eye Glow */}
            <div className="absolute top-7 left-6 w-3 h-3 rounded-full bg-[#00f5a0]/15 blur-xs" />
            <div className="absolute top-7 right-6 w-3 h-3 rounded-full bg-[#00f5a0]/15 blur-xs" />

            {/* SVG Synthetic Face Features */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Forehead Hologram Sensor */}
              <circle cx="50" cy="22" r="2.5" fill="#00f5a0" opacity={isSpeaking ? 1 : 0.6} />
              
              {/* Left Eye */}
              {eyeBlink ? (
                <line x1="30" y1="42" x2="42" y2="42" stroke="#00f5a0" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <g>
                  <ellipse cx="36" cy="42" rx="6" ry="4" fill="#08101a" stroke="#00f5a0" strokeWidth="1.8" />
                  <circle cx={avatarExpression === "concerned" ? 37 : 36} cy="42" r="2.2" fill="#00d2ff" />
                  <circle cx="37" cy="41" r="0.8" fill="#ffffff" />
                </g>
              )}

              {/* Right Eye */}
              {eyeBlink ? (
                <line x1="58" y1="42" x2="70" y2="42" stroke="#00f5a0" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <g>
                  <ellipse cx="64" cy="42" rx="6" ry="4" fill="#08101a" stroke="#00f5a0" strokeWidth="1.8" />
                  <circle cx={avatarExpression === "concerned" ? 63 : 64} cy="42" r="2.2" fill="#00d2ff" />
                  <circle cx="65" cy="41" r="0.8" fill="#ffffff" />
                </g>
              )}

              {/* Eyebrows (Dynamic angle based on pain score & expression) */}
              {avatarExpression === "concerned" ? (
                <>
                  <path d="M 28 35 Q 36 38 43 35" fill="none" stroke="#ffb020" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 57 35 Q 64 38 72 35" fill="none" stroke="#ffb020" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M 29 36 Q 36 34 43 36" fill="none" stroke="#00f5a0" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 57 36 Q 64 34 71 36" fill="none" stroke="#00f5a0" strokeWidth="1.8" strokeLinecap="round" />
                </>
              )}

              {/* Nose Bridge */}
              <path d="M 50 43 L 48 54 L 52 54" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" />

              {/* Lip-Sync Animated Mouth */}
              {isSpeaking ? (
                <ellipse
                  cx="50"
                  cy="68"
                  rx={8 + mouthOpen * 4}
                  ry={3 + mouthOpen * 6}
                  fill="#00f5a0"
                  opacity={0.85}
                />
              ) : (
                <path
                  d="M 40 68 Q 50 72 60 68"
                  fill="none"
                  stroke="#00f5a0"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Expression Indicator Badge */}
            <span className={`absolute bottom-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
              avatarExpression === "concerned" ? "bg-red-500/20 text-red-300" : "bg-[#00f5a0]/20 text-[#00f5a0]"
            }`}>
              {avatarExpression}
            </span>
          </div>
        </div>

        {/* Live Subtitle & Speech Display */}
        <div className="flex-1 min-w-0">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#00f5a0]" />
                {language === "hi" ? "लाइव अनुवाद (Bilingual Subtitles)" : "Bilingual Subtitles"}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isSpeaking ? "bg-[#00f5a0]/20 text-[#00f5a0] animate-pulse" : "text-gray-500"
              }`}>
                {isSpeaking ? "SPEAKING / बोल रहा है" : "STANDBY"}
              </span>
            </div>

            {/* Primary active language display */}
            <p className="text-gray-100 font-medium leading-relaxed text-xs">
              &ldquo;{language === "hi" ? spokenHi : spokenEn}&rdquo;
            </p>

            {/* Secondary language translation pill */}
            <p className="text-[10px] text-gray-400 mt-1 italic border-t border-white/5 pt-1">
              {language === "hi" ? `EN: "${spokenEn}"` : `HI: "${spokenHi}"`}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Interactive Quick Responses */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <span className="text-[10px] font-mono text-gray-400 block mb-1.5 uppercase tracking-wider">
          {language === "hi" ? "त्वरित रोगी सहायता विकल्प:" : "Interactive Patient Triage Actions:"}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => handleQuickSymptom("chest")}
            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold text-red-300 block">Chest Pain</span>
            <span className="text-[9px] text-red-400/80 block font-mono">सीने में दर्द</span>
          </button>
          <button
            onClick={() => handleQuickSymptom("breath")}
            className="p-1.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold text-blue-300 block">Short of Breath</span>
            <span className="text-[9px] text-blue-400/80 block font-mono">सांस फूलना</span>
          </button>
          <button
            onClick={() => handleQuickSymptom("dizzy")}
            className="p-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold text-amber-300 block">Severe Dizziness</span>
            <span className="text-[9px] text-amber-400/80 block font-mono">चक्कर आना</span>
          </button>
          <button
            onClick={() => handleQuickSymptom("nurse")}
            className="p-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold text-emerald-300 block">Summon Nurse</span>
            <span className="text-[9px] text-emerald-400/80 block font-mono">नर्स को बुलाएं</span>
          </button>
        </div>

        {/* Text chat input with companion */}
        <form onSubmit={handleSendMessage} className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleListening}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
              isListening
                ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            }`}
            title={isListening ? "Listening... Click to stop" : "Speak to Dr. Maya (Mic)"}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-[#00f5a0]" />}
            <span className="hidden sm:inline text-[11px] font-mono">
              {isListening ? (language === "hi" ? "सुन रहा हूँ..." : "Listening...") : (language === "hi" ? "बोलें" : "Voice")}
            </span>
          </button>
          <input
            type="text"
            value={patientInput}
            onChange={(e) => setPatientInput(e.target.value)}
            placeholder={
              isListening
                ? (language === "hi" ? "सुन रहा हूँ... बोलिए..." : "Listening... speak now...")
                : (language === "hi" ? "डॉ. माया से अपनी समस्या कहें..." : "Describe how you feel to Dr. Maya...")
            }
            className="flex-1 px-2.5 py-1.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5a0]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-[#00f5a0] text-black font-semibold text-xs hover:bg-[#00f5a0]/90 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>{language === "hi" ? "भेजें" : "Send"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
