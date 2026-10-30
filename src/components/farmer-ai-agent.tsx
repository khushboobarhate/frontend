"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Calculator,
  Camera,
  CheckCircle2,
  Globe2,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Send,
  Sparkles,
  Sprout,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  analyzeCropPhoto,
  askFarmerAi,
  calculateCropProfit,
  getMarketIntelligence,
  transcribeVoiceRecording,
  updateAiOnboarding,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import type {
  AiChatMessage,
  MarketDataCrop,
  ProfitResult,
  RegionalComparisonItem,
} from "@/types";

interface OnboardingStep {
  titleKey: string;
  descKey: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { titleKey: "step1Title", descKey: "step1Desc" },
  { titleKey: "step2Title", descKey: "step2Desc" },
  { titleKey: "step3Title", descKey: "step3Desc" },
  { titleKey: "step4Title", descKey: "step4Desc" },
  { titleKey: "step5Title", descKey: "step5Desc" },
  { titleKey: "step6Title", descKey: "step6Desc" },
];

export function FarmerAiAgent() {
  const locale = useLocale();
  const t = useTranslations("AiAgent");
  const tCommon = useTranslations("Common");
  const { user } = useAuth();

  // Chat conversation state
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Media & Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Onboarding walkthrough state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Active View / Tab: 'chat' | 'market' | 'profit'
  const [activeTab, setActiveTab] = useState<"chat" | "market" | "profit">("chat");

  // Market Intelligence state
  const [selectedCrop, setSelectedCrop] = useState("wheat");
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketDataCrop | null>(null);
  const [regionalDemand, setRegionalDemand] = useState<RegionalComparisonItem[]>([]);

  // Profit Calculator state
  const [profitInputs, setProfitInputs] = useState({
    cropName: "Wheat",
    quantity: 50,
    sellingPrice: 2450,
    productionCost: 55000,
    transportCost: 4000,
    handlingCost: 1500,
    otherExpenses: 2000,
  });
  const [profitResult, setProfitResult] = useState<ProfitResult | null>(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const msgSeqRef = useRef(0);

  // Check onboarding on mount
  useEffect(() => {
    try {
      const completedLocal = typeof window !== "undefined" ? localStorage.getItem("sm_ai_onboarding_done") : "true";
      if (!completedLocal && !user?.ai_onboarding_completed) {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage fallback
    }
  }, [user]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Load market intelligence when tab or selected crop changes
  useEffect(() => {
    let ignore = false;
    if (activeTab === "market") {
      const load = async () => {
        setMarketLoading(true);
        try {
          const res = await getMarketIntelligence(selectedCrop, user?.state || "Maharashtra");
          if (!ignore && res.success && res.data) {
            setMarketData(res.data.crop);
            setRegionalDemand(res.data.regionalComparison || []);
          }
        } catch (err) {
          console.warn("Market intelligence fetch failed:", err);
        } finally {
          if (!ignore) {
            setMarketLoading(false);
          }
        }
      };
      const timer = setTimeout(() => {
        void load();
      }, 0);
      return () => {
        ignore = true;
        clearTimeout(timer);
      };
    }
  }, [activeTab, selectedCrop, user]);

  const handleFinishOnboarding = async () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("sm_ai_onboarding_done", "true");
      await updateAiOnboarding(true);
    } catch {}
  };

  // ----------------------------------------------------------------
  // Text Chat Submission
  // ----------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiTyping) return;

    setErrorMsg("");
    msgSeqRef.current += 1;
    const userMessage: AiChatMessage = {
      id: `user-${msgSeqRef.current}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsAiTyping(true);

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const response = await askFarmerAi(text, locale, history);

      if (response.success && response.data) {
        msgSeqRef.current += 1;
        const aiMessage: AiChatMessage = {
          id: `ai-${msgSeqRef.current}`,
          role: "assistant",
          content: response.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          marketData: response.data.marketData,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("errorGeneral"));
    } finally {
      setIsAiTyping(false);
    }
  };

  // ----------------------------------------------------------------
  // Image Upload / Camera Handling
  // ----------------------------------------------------------------
  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    const previewUrl = URL.createObjectURL(file);
    msgSeqRef.current += 1;
    const userMessage: AiChatMessage = {
      id: `user-${msgSeqRef.current}`,
      role: "user",
      content: t("uploadedPhotoMessage"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imagePreview: previewUrl,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAiTyping(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("language", locale);

      const response = await analyzeCropPhoto(formData);
      if (response.success && response.data) {
        msgSeqRef.current += 1;
        const aiMessage: AiChatMessage = {
          id: `ai-${msgSeqRef.current}`,
          role: "assistant",
          content: response.data.analysis,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("imageError"));
    } finally {
      setIsAiTyping(false);
      // Reset input
      event.target.value = "";
    }
  };

  // ----------------------------------------------------------------
  // Voice Recording (Microphone) & Transcription
  // ----------------------------------------------------------------
  const startRecording = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await processVoiceAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMsg(t("micPermissionError"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const processVoiceAudio = async (blob: Blob) => {
    setIsAiTyping(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", locale);

      const result = await transcribeVoiceRecording(formData);
      if (result.success && result.data?.text) {
        // Send transcribed message to chat
        await handleSendMessage(result.data.text);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("transcribeError"));
      setIsAiTyping(false);
    }
  };

  // ----------------------------------------------------------------
  // Audio Playback (TTS & SpeechSynthesis Fallback)
  // ----------------------------------------------------------------
  const handlePlayAudio = async (message: AiChatMessage) => {
    if (playingMessageId === message.id) {
      // Pause
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setPlayingMessageId(null);
      return;
    }

    // Stop currently playing
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setAudioLoadingId(message.id);

    try {
      // Clean markdown tags for clear speech
      const textForSpeech = message.content
        .replace(/[*#_`~>]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .slice(0, 300);

      // Attempt backend audio stream
      const ttsUrl = `/api/backend/api/farmer/ai/tts?text=${encodeURIComponent(textForSpeech)}&lang=${locale}`;
      const audio = new Audio(ttsUrl);
      audioPlayerRef.current = audio;

      audio.onloadeddata = () => {
        setAudioLoadingId(null);
        setPlayingMessageId(message.id);
        audio.play().catch(() => playBrowserSpeech(textForSpeech, message.id));
      };

      audio.onended = () => {
        setPlayingMessageId(null);
      };

      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis
        playBrowserSpeech(textForSpeech, message.id);
      };
    } catch {
      playBrowserSpeech(message.content.slice(0, 300), message.id);
    }
  };

  const playBrowserSpeech = (text: string, msgId: string) => {
    setAudioLoadingId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : locale === "mr" ? "mr-IN" : "en-IN";
      utterance.rate = 0.95;

      utterance.onstart = () => setPlayingMessageId(msgId);
      utterance.onend = () => setPlayingMessageId(null);
      utterance.onerror = () => setPlayingMessageId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingMessageId(null);
    }
  };

  // ----------------------------------------------------------------
  // Profit Calculator Execution
  // ----------------------------------------------------------------
  const handleCalculateProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfitLoading(true);
    try {
      const res = await calculateCropProfit(profitInputs);
      if (res.success && res.data) {
        setProfitResult(res.data);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("calcError"));
    } finally {
      setProfitLoading(false);
    }
  };

  return (
    <div className="farmer-ai-agent-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* AI Assistant Header */}
      <section
        className="panel ai-agent-header"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderLeft: "4px solid var(--forest, #203e2d)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--forest, #203e2d)",
              color: "var(--lime, #d8ed9b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--forest)" }}>
                {t("title")}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                {t("statusOnline")}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Header Right: Language pill and Walkthrough trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--cream)",
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--forest)",
              border: "1px solid var(--line)",
            }}
          >
            <Globe2 size={14} />
            <span>{locale.toUpperCase()}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStep(0);
              setShowOnboarding(true);
            }}
            className="button button-outline button-small"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <HelpCircle size={14} />
            {t("replayGuide")}
          </button>
        </div>
      </section>

      {/* Mode / Feature Navigation Tabs */}
      <div
        className="ai-tabs"
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--line)",
          paddingBottom: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: activeTab === "chat" ? 600 : 500,
            color: activeTab === "chat" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "chat" ? "3px solid var(--forest)" : "3px solid transparent",
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Bot size={16} />
          {t("chatTab")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("market")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: activeTab === "market" ? 600 : 500,
            color: activeTab === "market" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "market" ? "3px solid var(--forest)" : "3px solid transparent",
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <TrendingUp size={16} />
          {t("marketTab")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profit")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: activeTab === "profit" ? 600 : 500,
            color: activeTab === "profit" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "profit" ? "3px solid var(--forest)" : "3px solid transparent",
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Calculator size={16} />
          {t("profitTab")}
        </button>
      </div>

      {/* Guided Onboarding Modal */}
      {showOnboarding && (
        <div
          className="onboarding-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(24, 49, 35, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="onboarding-card panel"
            style={{
              width: "min(480px, 100%)",
              padding: 24,
              borderRadius: 16,
              background: "#fff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", textTransform: "uppercase" }}>
                {t("tutorialStep", { current: currentStep + 1, total: ONBOARDING_STEPS.length })}
              </span>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>
                {t(ONBOARDING_STEPS[currentStep].titleKey)}
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>
                {t(ONBOARDING_STEPS[currentStep].descKey)}
              </p>
            </div>

            {/* Stepper Dots & Navigation Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {ONBOARDING_STEPS.map((_, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: idx === currentStep ? 20 : 7,
                      height: 7,
                      borderRadius: 4,
                      background: idx === currentStep ? "var(--forest)" : "var(--line)",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="button button-outline button-small"
                  >
                    {t("back")}
                  </button>
                )}
                {currentStep < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="button button-lime button-small"
                  >
                    {t("next")}
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="button button-lime button-small"
                  >
                    {t("finish")}
                    <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 1: CHAT CONVERSATION                                     */}
      {/* ------------------------------------------------------------ */}
      {activeTab === "chat" && (
        <section className="panel ai-chat-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "640px" }}>
          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: "var(--paper, #faf9f5)",
            }}
          >
            {/* Welcome Greeting & Suggested Question Cards */}
            {messages.length === 0 && (
              <div style={{ margin: "auto", maxWidth: 640, textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: "var(--forest)",
                  }}
                >
                  <Sprout size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>
                  {t("welcomeTitle")}
                </h3>
                <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.5 }}>
                  {t("welcomeDesc")}
                </p>

                {/* Suggested Questions Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, textAlign: "left" }}>
                  {[
                    { text: t("suggested1"), icon: Camera },
                    { text: t("suggested2"), icon: TrendingUp },
                    { text: t("suggested3"), icon: Sprout },
                    { text: t("suggested4"), icon: Calculator },
                    { text: t("suggested5"), icon: Bot },
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(card.text)}
                      className="suggested-card"
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#fff",
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 13,
                        color: "var(--ink)",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "var(--cream)",
                          color: "var(--forest)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <card.icon size={16} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{card.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isPlaying = playingMessageId === msg.id;
              const isLoadingAudio = audioLoadingId === msg.id;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "min(680px, 85%)",
                      padding: "14px 18px",
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      background: isUser ? "var(--forest, #203e2d)" : "#ffffff",
                      color: isUser ? "#ffffff" : "var(--ink, #25382b)",
                      border: isUser ? "none" : "1px solid var(--line)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {/* User Photo Preview if attached */}
                    {msg.imagePreview && (
                      <div style={{ marginBottom: 6 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imagePreview}
                          alt="Crop upload preview"
                          style={{
                            maxWidth: "240px",
                            maxHeight: "180px",
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "2px solid rgba(255,255,255,0.4)",
                          }}
                        />
                      </div>
                    )}

                    {/* Message Text Content */}
                    <div style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.6 }}>
                      {msg.content}
                    </div>

                    {/* AI Message Action Bar (Audio Listen Button & Timestamp) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 6,
                        borderTop: isUser ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--line)",
                        fontSize: 11,
                        color: isUser ? "rgba(255,255,255,0.7)" : "var(--muted)",
                      }}
                    >
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(msg)}
                          disabled={isLoadingAudio}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: isPlaying ? "var(--forest)" : "var(--cream)",
                            color: isPlaying ? "var(--lime)" : "var(--forest)",
                            border: "none",
                            borderRadius: 14,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isLoadingAudio ? (
                            <Loader2 size={12} className="spin" />
                          ) : isPlaying ? (
                            <Pause size={12} />
                          ) : (
                            <Volume2 size={12} />
                          )}
                          <span>
                            {isLoadingAudio
                              ? t("audioLoading")
                              : isPlaying
                                ? t("pauseAudio")
                                : t("listenAudio")}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Spinner */}
            {isAiTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: "16px 16px 16px 2px",
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "var(--forest)",
                  }}
                >
                  <Loader2 size={16} className="spin" />
                  <span>{t("processing")}</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div
              style={{
                padding: "8px 16px",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #fecaca",
              }}
            >
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg("")}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Voice Recording Active Bar */}
          {isRecording && (
            <div
              style={{
                padding: "10px 16px",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #fde68a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#dc2626",
                    animation: "pulse 1.2s infinite",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  {t("listening")} ({recordingSeconds}s)
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="button button-small"
                style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
              >
                <MicOff size={14} />
                {t("stopRecord")}
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div
            style={{
              padding: "12px 16px",
              background: "#ffffff",
              borderTop: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleImageFileChange}
            />

            {/* Photo Upload Button */}
            <button
              type="button"
              className="icon-button"
              title={t("uploadPhoto")}
              aria-label={t("uploadPhoto")}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--forest)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={18} />
            </button>

            {/* Camera Photo Button */}
            <button
              type="button"
              className="icon-button"
              title={t("takePhoto")}
              aria-label={t("takePhoto")}
              onClick={() => cameraInputRef.current?.click()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--forest)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={18} />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              className="icon-button"
              title={isRecording ? t("stopRecord") : t("voiceRecord")}
              aria-label={isRecording ? t("stopRecord") : t("voiceRecord")}
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: isRecording ? "1px solid #dc2626" : "1px solid var(--line)",
                background: isRecording ? "#fee2e2" : "transparent",
                color: isRecording ? "#dc2626" : "var(--forest)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={18} />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={t("inputPlaceholder")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 14,
                outline: "none",
              }}
            />

            {/* Send Button */}
            <button
              type="button"
              disabled={!inputText.trim() || isAiTyping}
              onClick={() => handleSendMessage()}
              className="button button-lime"
              style={{
                padding: "10px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Send size={15} />
              <span>{t("send")}</span>
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 2: CROP MARKET INTELLIGENCE                              */}
      {/* ------------------------------------------------------------ */}
      {activeTab === "market" && (
        <section className="panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--forest)" }}>
                {t("mandiPrices")}
              </h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                {t("mandiPricesSubtitle")}
              </p>
            </div>

            {/* Crop Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                {t("selectCrop")}:
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  fontSize: 13,
                  background: "#fff",
                  fontWeight: 600,
                  color: "var(--forest)",
                }}
              >
                <option value="wheat">Wheat (गेहूं / ઘઉં)</option>
                <option value="rice">Paddy / Rice (धान / ચોખા)</option>
                <option value="soybean">Soybean (सोयाबीन)</option>
                <option value="cotton">Cotton (कपास / કપાસ)</option>
                <option value="tomato">Tomato (टमाटर / ટામેટાં)</option>
                <option value="onion">Onion (प्याज़ / ડુંગળી)</option>
                <option value="maize">Maize (मक्का / મકાઈ)</option>
              </select>
            </div>
          </div>

          {marketLoading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Loader2 size={32} className="spin" style={{ margin: "0 auto" }} />
              <p style={{ marginTop: 8, color: "var(--muted)" }}>{tCommon("loading")}</p>
            </div>
          ) : marketData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* APMC Mandi Comparison Table */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 12 }}>
                  {t("regionalDemand")} ({marketData.unit})
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "var(--cream)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>{t("market")}</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>{t("state")}</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>{t("price")}</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>{t("demand")}</th>
                        <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>{t("opportunity")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalDemand.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.market}</td>
                          <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{item.state}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--forest)" }}>
                            ₹{item.marketPrice} {item.priceUnit}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                background: item.demandIndicator === "Very High" ? "#dcfce7" : "#fef3c7",
                                color: item.demandIndicator === "Very High" ? "#166534" : "#92400e",
                              }}
                            >
                              {item.demandIndicator}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--ink)" }}>
                            <strong>₹{item.netEstimatedRealization}</strong> (after ₹{item.estimatedTransportCost} freight)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two Column Grid: Industrial Uses & Verified Buyers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                {/* Industrial Uses Card */}
                <div style={{ padding: 16, background: "var(--cream)", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--forest)", marginBottom: 10 }}>
                    {t("industrialUses")}
                  </h4>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }}>
                    {marketData.applications?.map((app: string, idx: number) => (
                      <li key={idx}>{app}</li>
                    ))}
                  </ul>
                </div>

                {/* Verified Institutional Buyers */}
                <div style={{ padding: 16, background: "#fff", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--forest)", marginBottom: 10 }}>
                    {t("potentialBuyers")}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {marketData.buyers?.map((buyer, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: "var(--paper)",
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--ink)" }}>{buyer.name}</strong>
                          <div style={{ color: "var(--muted)", fontSize: 11 }}>{buyer.location}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "#dcfce7",
                            color: "#166534",
                            fontWeight: 600,
                          }}
                        >
                          {buyer.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                {marketData.disclaimer || t("marketDisclaimer")}
              </p>
            </div>
          ) : null}
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 3: MATHEMATICAL PROFIT CALCULATOR                        */}
      {/* ------------------------------------------------------------ */}
      {activeTab === "profit" && (
        <section className="panel" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--forest)" }}>
              {t("profitCalculatorTitle")}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              {t("profitCalculatorSubtitle")}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Input Form */}
            <form onSubmit={handleCalculateProfit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  {t("cropName")}
                </label>
                <input
                  type="text"
                  value={profitInputs.cropName}
                  onChange={(e) => setProfitInputs({ ...profitInputs, cropName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    {t("quantity")} (Quintals)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={profitInputs.quantity}
                    onChange={(e) => setProfitInputs({ ...profitInputs, quantity: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    {t("sellingPrice")} (₹/Quintal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profitInputs.sellingPrice}
                    onChange={(e) => setProfitInputs({ ...profitInputs, sellingPrice: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  {t("productionCost")} (₹ Total seeds, fertilizer, labor)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profitInputs.productionCost}
                  onChange={(e) => setProfitInputs({ ...profitInputs, productionCost: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    {t("transportCost")} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profitInputs.transportCost}
                    onChange={(e) => setProfitInputs({ ...profitInputs, transportCost: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    {t("otherExpenses")} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profitInputs.otherExpenses}
                    onChange={(e) => setProfitInputs({ ...profitInputs, otherExpenses: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profitLoading}
                className="button button-lime"
                style={{ marginTop: 6, justifyContent: "center" }}
              >
                {profitLoading ? <Loader2 size={16} className="spin" /> : <Calculator size={16} />}
                {t("calculate")}
              </button>
            </form>

            {/* Profit Analysis Result Card */}
            <div
              style={{
                padding: 20,
                background: "var(--cream)",
                borderRadius: 12,
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--forest)", marginBottom: 14 }}>
                  {t("profitSummary")}
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>{t("grossRevenue")}:</span>
                    <strong style={{ color: "var(--ink)" }}>
                      ₹{profitResult ? profitResult.grossRevenue.toLocaleString() : (profitInputs.quantity * profitInputs.sellingPrice).toLocaleString()}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>{t("totalExpenses")}:</span>
                    <strong style={{ color: "#b91c1c" }}>
                      ₹{profitResult ? profitResult.expensesBreakdown.totalExpenses.toLocaleString() : (profitInputs.productionCost + profitInputs.transportCost + profitInputs.otherExpenses).toLocaleString()}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed var(--line)",
                      paddingTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: "var(--forest)" }}>{t("netProfit")}:</span>
                    <span
                      style={{
                        color: (profitResult?.netProfit ?? 0) >= 0 ? "#15803d" : "#b91c1c",
                      }}
                    >
                      ₹{profitResult ? profitResult.netProfit.toLocaleString() : ((profitInputs.quantity * profitInputs.sellingPrice) - (profitInputs.productionCost + profitInputs.transportCost + profitInputs.otherExpenses)).toLocaleString()}
                    </span>
                  </div>

                  {profitResult && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: "var(--muted)" }}>{t("profitMargin")}:</span>
                      <strong style={{ color: "#15803d" }}>{profitResult.profitMarginPercent}%</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)" }}>
                💡 <em>Revenue = Quantity × Selling Price | Net Profit = Revenue − Total Expenses</em>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
