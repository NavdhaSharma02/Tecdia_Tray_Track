"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";

type Pose = "walk" | "sit" | "wave" | "jump" | "spin" | "point" | "blink" | "stretch";
type Expression = "happy" | "curious" | "sleepy" | "surprised";
type FlowStepName = "IDLE" | "EMAIL_AUTH" | "SCANNING" | "BILL" | "PAYMENT" | "DONE";

type MotionState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  lookX: number;
  lookY: number;
  scrollDrift: number;
  entranceComplete: boolean;
  actionUntil: number;
  lastInteractionAt: number;
  lastIdleActionAt: number;
  lastScrollBubbleAt: number;
  roamUntil: number;
  roamX: number;
  roamY: number;
};

type BubbleOptions = {
  interruptSpeech?: boolean;
  speak?: boolean;
};

const STORAGE_KEY = "tecdia-mascot-enabled";
const CHARACTER_SIZE = 124;
const MOBILE_CHARACTER_SIZE = 94;
const INACTIVITY_MS = 4200;
const IDLE_ACTION_GAP_MS = 7000;

const STEP_MESSAGES: Record<FlowStepName, string> = {
  IDLE: "Hi there! Ready to build your tray?",
  EMAIL_AUTH: "New here? Scan your ID and fill in your details to sign up.",
  SCANNING: "Hold steady. I am watching the tray with you.",
  BILL: "Looks tasty. Double-check before paying!",
  PAYMENT: "Almost done. Pick the payment option you like.",
  DONE: "All set. Enjoy your meal!",
};

const IDLE_MESSAGES = [
  "Still here if you need me.",
  "Just chilling like halo-halo ice.",
  "This kiosk feels extra sweet today.",
];

const TECDIA_MESSAGES = [
  "Let's do it, Tecdia Cebu.",
  "Tecdia Cebu, ready when you are.",
  "Another smooth tray check for Tecdia Cebu.",
  "Tecdia Cebu, let's keep things moving.",
];

const FILIPINO_FOOD_FACTS = [
  "Fun fact: halo-halo means mix-mix in Filipino.",
  "Fun fact: adobo is known for its savory mix of vinegar, soy sauce, and garlic.",
  "Fun fact: bibingka is a classic rice cake often enjoyed during Christmas season.",
  "Fun fact: sinigang is loved for its bright, sour broth.",
  "Fun fact: ube is a purple yam that gives desserts their vivid color.",
  "Fun fact: pancit is often served at birthdays as a symbol of long life.",
];

const CLICK_MESSAGES = [
  "Boing!",
  "You tapped my cup!",
  "Wheee!",
  "That tickles my toppings.",
];

const SCROLL_MESSAGES = [
  "Zooming along with you.",
  "I can keep up.",
  "Scrolling adventure!",
];

const STEP_ROAM_BIAS: Record<FlowStepName, number> = {
  IDLE: -0.18,
  EMAIL_AUTH: -0.08,
  SCANNING: 0.14,
  BILL: 0.2,
  PAYMENT: 0.08,
  DONE: -0.04,
};

const VOICE_NAME_HINTS = [
  "zira",
  "aria",
  "jenny",
  "samantha",
  "ava",
  "allison",
  "serena",
  "karen",
  "moira",
  "female",
  "woman",
  "girl",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeMessageForSpeech(message: string) {
  return message.replace(/\btecdia\b/gi, "Tech-dia");
}

function getPointableButton() {
  if (typeof document === "undefined") {
    return null;
  }

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".customer-panel button, .customer-panel a, .customer-panel [role='button']"
    )
  ).filter((element) => {
    const text = (element.textContent ?? "").trim();
    const rect = element.getBoundingClientRect();

    return (
      text.length > 0 &&
      !text.toLowerCase().includes("mascot") &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  });

  if (!candidates.length) {
    return null;
  }

  const preferred =
    candidates.find((element) => element.tagName === "BUTTON") ??
    candidates[0];
  const rect = preferred.getBoundingClientRect();

  return {
    centerX: rect.left + rect.width / 2,
  };
}

export default function CustomerCatCompanion() {
  const { step } = useCustomerFlow();
  // Default true on server + first client paint so SSR markup matches hydration.
  const [enabled, setEnabled] = useState(true);
  const [preferenceReady, setPreferenceReady] = useState(false);
  const [pose, setPose] = useState<Pose>("walk");
  const [expression, setExpression] = useState<Expression>("happy");
  const [bubble, setBubble] = useState<string>("Hi there!");
  const [bubbleVisible, setBubbleVisible] = useState(true);

  const characterRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const pupilLeftRef = useRef<SVGGElement | null>(null);
  const pupilRightRef = useRef<SVGGElement | null>(null);
  const motionRef = useRef<MotionState>({
    x: -140,
    y: 180,
    targetX: -140,
    targetY: 180,
    lookX: 0,
    lookY: 0,
    scrollDrift: 0,
    entranceComplete: false,
    actionUntil: 0,
    lastInteractionAt: 0,
    lastIdleActionAt: 0,
    lastScrollBubbleAt: 0,
    roamUntil: 0,
    roamX: 0,
    roamY: 0,
  });
  const viewportRef = useRef({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
  });
  const bubbleTimeoutRef = useRef<number | null>(null);
  const poseTimeoutRef = useRef<number | null>(null);
  const deferredActionRef = useRef<number | null>(null);
  const speechVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rafRef = useRef(0);
  const facingLeftRef = useRef(false);
  const expressionRef = useRef<Expression>("happy");
  const poseRef = useRef<Pose>("walk");
  const hasWelcomedRef = useRef(false);
  const lastAnnouncedStepRef = useRef<FlowStepName | null>(null);
  const enabledRef = useRef(true);

  const currentStep = (step as FlowStepName) || "IDLE";
  const sectionMessage = useMemo(() => STEP_MESSAGES[currentStep], [currentStep]);

  const clearBubbleTimeout = useCallback(() => {
    if (bubbleTimeoutRef.current) {
      window.clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
  }, []);

  const clearDeferredAction = useCallback(() => {
    if (deferredActionRef.current) {
      window.cancelAnimationFrame(deferredActionRef.current);
      deferredActionRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
  }, []);

  const primeVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      return;
    }

    const findPreferredVoice = (voiceList: SpeechSynthesisVoice[]) =>
      voiceList.find((voice) =>
        VOICE_NAME_HINTS.some((hint) => voice.name.toLowerCase().includes(hint))
      );

    const englishPhVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en-ph"));
    const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));

    speechVoiceRef.current =
      findPreferredVoice(englishPhVoices) ??
      englishPhVoices[0] ??
      findPreferredVoice(englishVoices) ??
      englishVoices[0] ??
      findPreferredVoice(voices) ??
      voices[0];
  }, []);

  const speakMessage = useCallback(
    (message: string, interruptSpeech = false) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      if (!enabledRef.current) {
        stopSpeaking();
        return;
      }

      primeVoice();
      if (interruptSpeech) {
        stopSpeaking();
      } else if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(normalizeMessageForSpeech(message));
      utterance.voice = speechVoiceRef.current;
      utterance.rate = 1.06;
      utterance.pitch = 1.38;
      utterance.volume = 0.8;
      utterance.lang = speechVoiceRef.current?.lang ?? "en-PH";
      window.speechSynthesis.speak(utterance);
    },
    [primeVoice, stopSpeaking]
  );

  const runDeferred = useCallback(
    (callback: () => void) => {
      clearDeferredAction();
      deferredActionRef.current = window.requestAnimationFrame(() => {
        deferredActionRef.current = null;
        startTransition(callback);
      });
    },
    [clearDeferredAction]
  );

  const showBubble = useCallback(
    (message: string, duration = 2600, options: BubbleOptions = {}) => {
      const { interruptSpeech = false, speak = true } = options;

      if (!enabledRef.current) {
        setBubbleVisible(false);
        clearBubbleTimeout();
        stopSpeaking();
        return;
      }

      setBubble(message);
      setBubbleVisible(true);
      if (speak) {
        speakMessage(message, interruptSpeech);
      }
      clearBubbleTimeout();
      bubbleTimeoutRef.current = window.setTimeout(() => {
        setBubbleVisible(false);
      }, duration);
    },
    [clearBubbleTimeout, speakMessage, stopSpeaking]
  );

  const setExpressionSafe = useCallback((next: Expression) => {
    if (expressionRef.current !== next) {
      expressionRef.current = next;
      setExpression(next);
    }
  }, []);

  const setFacingSafe = useCallback((next: boolean) => {
    if (facingLeftRef.current !== next) {
      facingLeftRef.current = next;
    }
  }, []);

  const setPoseSafe = useCallback((next: Pose) => {
    if (poseRef.current !== next) {
      poseRef.current = next;
      setPose(next);
    }
  }, []);

  const schedulePose = useCallback(
    (next: Pose, duration: number, after: Pose = "sit") => {
      const motion = motionRef.current;
      const now = performance.now();
      motion.actionUntil = now + duration;
      setPoseSafe(next);

      if (poseTimeoutRef.current) {
        window.clearTimeout(poseTimeoutRef.current);
      }

      poseTimeoutRef.current = window.setTimeout(() => {
        if (!enabled) return;
        setPoseSafe(after);
      }, duration);
    },
    [enabled, setPoseSafe]
  );

  const markInteraction = useCallback(() => {
    motionRef.current.lastInteractionAt = performance.now();
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    primeVoice();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.onvoiceschanged = primeVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [primeVoice]);

  useEffect(() => {
    if (!preferenceReady || !enabled || hasWelcomedRef.current) {
      return;
    }

    hasWelcomedRef.current = true;
    runDeferred(() => {
      showBubble("Hi there! I am Halu.", 3200, { interruptSpeech: true });
    });
  }, [enabled, preferenceReady, runDeferred, showBubble]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextEnabled = stored !== "false";
    enabledRef.current = nextEnabled;
    if (!nextEnabled) {
      clearBubbleTimeout();
      clearDeferredAction();
      stopSpeaking();
    }
    runDeferred(() => {
      setEnabled(nextEnabled);
      setBubbleVisible(nextEnabled);
      setPreferenceReady(true);
    });
  }, [clearBubbleTimeout, clearDeferredAction, runDeferred, stopSpeaking]);

  useEffect(() => {
    if (!preferenceReady) return;
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  }, [enabled, preferenceReady]);

  useEffect(() => {
    if (!enabled) {
      clearBubbleTimeout();
      clearDeferredAction();
      stopSpeaking();
      return;
    }
  }, [clearBubbleTimeout, clearDeferredAction, enabled, stopSpeaking]);

  useEffect(() => {
    if (!preferenceReady || !enabled) return;
    if (lastAnnouncedStepRef.current === currentStep) return;
    lastAnnouncedStepRef.current = currentStep;

    runDeferred(() => {
      showBubble(sectionMessage, 2400);
      if (currentStep === "SCANNING" || currentStep === "BILL") {
        schedulePose("point", 1800, "sit");
      } else if (currentStep === "DONE") {
        schedulePose("wave", 1800, "sit");
      }
    });
  }, [currentStep, enabled, preferenceReady, runDeferred, schedulePose, sectionMessage, showBubble]);

  useEffect(() => {
    if (!enabled) return;

    const updateViewport = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };

    const handleScroll = () => {
      const motion = motionRef.current;
      motion.scrollDrift = clamp(motion.scrollDrift + 14, -22, 24);
      markInteraction();
      setExpressionSafe("surprised");

      const now = performance.now();
      if (now - motion.lastScrollBubbleAt > 5000) {
        motion.lastScrollBubbleAt = now;
        showBubble(pickRandom(SCROLL_MESSAGES), 1800);
      }

      schedulePose("stretch", 900, "sit");
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, markInteraction, schedulePose, setExpressionSafe, showBubble]);

  useEffect(() => {
    if (!enabled) return;

    // The mascot position, glance direction, and idle transitions are coordinated here for smooth 60fps-like motion.
    const tick = (now: number) => {
      const character = characterRef.current;
      const bubbleNode = bubbleRef.current;
      const leftPupil = pupilLeftRef.current;
      const rightPupil = pupilRightRef.current;

      if (character && bubbleNode) {
        const motion = motionRef.current;
        const viewport = viewportRef.current;
        const isMobile = viewport.width < 768;
        const size = isMobile ? MOBILE_CHARACTER_SIZE : CHARACTER_SIZE;
        const laneMinX = size * (isMobile ? 0.95 : 0.85);
        const laneMaxX = viewport.width - size * (isMobile ? 0.95 : 0.85);
        const laneWidth = Math.max(0, laneMaxX - laneMinX);
        const floorY = viewport.height - (isMobile ? 92 : 104);
        const stepBiasX = laneWidth * STEP_ROAM_BIAS[currentStep];
        const roamRangeX = Math.max(laneWidth * 0.12, isMobile ? 46 : 72);
        const leftEdgeCenterX = clamp(laneMinX + laneWidth * 0.18 + stepBiasX * 0.2, laneMinX, laneMaxX);
        const rightEdgeCenterX = clamp(laneMinX + laneWidth * 0.82 + stepBiasX * 0.2, laneMinX, laneMaxX);
        const currentSideCenterX = facingLeftRef.current ? leftEdgeCenterX : rightEdgeCenterX;

        if (motion.roamUntil === 0) {
          motion.roamX = rightEdgeCenterX;
          motion.roamY = floorY;
          motion.roamUntil = now + 1600;
        }

        if (motion.entranceComplete && now > motion.roamUntil && now > motion.actionUntil) {
          const nextSideCenterX =
            Math.random() > 0.5 || Math.abs(motion.x - leftEdgeCenterX) < laneWidth * 0.08
              ? rightEdgeCenterX
              : leftEdgeCenterX;

          motion.roamUntil = now + 1800 + Math.random() * 2600;
          motion.roamX = clamp(
            nextSideCenterX + (Math.random() * 2 - 1) * roamRangeX,
            laneMinX,
            laneMaxX
          );
          motion.roamY = floorY + (Math.random() * 2 - 1) * (isMobile ? 8 : 12);

          if (Math.random() > 0.6) {
            const ambientPose = pickRandom<Pose>(["wave", "blink", "stretch"]);
            schedulePose(ambientPose, 1200, "sit");
            setExpressionSafe(ambientPose === "blink" ? "sleepy" : "happy");
          }
        }

        const baseX = motion.roamX;
        const baseY = motion.roamY + motion.scrollDrift;

        if (!motion.entranceComplete) {
          motion.targetX = clamp(viewport.width * (isMobile ? 0.34 : 0.28), laneMinX, laneMaxX);
          motion.targetY = baseY;
          motion.x += (motion.targetX - motion.x) * 0.07;
          motion.y += (motion.targetY - motion.y) * 0.09;

          if (Math.abs(motion.targetX - motion.x) < 10) {
            motion.entranceComplete = true;
            setPoseSafe("sit");
          } else {
            setPoseSafe("walk");
          }
        } else {
          motion.targetX = clamp(baseX, laneMinX, laneMaxX);
          motion.targetY = baseY;

          motion.x += (motion.targetX - motion.x) * 0.095;
          motion.y += (motion.targetY - motion.y) * 0.1;
          motion.scrollDrift *= 0.86;

          const travelX = motion.targetX - motion.x;
          const lookTargetX = clamp(travelX / 26, -4.5, 4.5);
          const lookTargetY = Math.sin(now / 1200) * 1.4;

          motion.lookX += (lookTargetX - motion.lookX) * 0.18;
          motion.lookY += (lookTargetY - motion.lookY) * 0.18;

          setFacingSafe(travelX < -4);

          const isTraveling = Math.abs(motion.targetX - motion.x) > 12;

          if (now > motion.lastInteractionAt + INACTIVITY_MS && now > motion.actionUntil) {
            if (now - motion.lastIdleActionAt > IDLE_ACTION_GAP_MS) {
              motion.lastIdleActionAt = now;
              const pointTarget = getPointableButton();

              if (pointTarget && Math.random() > 0.42) {
                const pointFromLeft = pointTarget.centerX < viewport.width / 2;
                motion.roamX = pointFromLeft ? leftEdgeCenterX : rightEdgeCenterX;
                motion.roamY = floorY;
                motion.roamUntil = now + 2200;
                setFacingSafe(!pointFromLeft);
                schedulePose("point", 1600, "sit");
                setExpressionSafe("curious");
              } else {
                const idlePose = pickRandom<Pose>(["wave", "blink", "stretch"]);
                schedulePose(idlePose, 1400, "sit");
                setExpressionSafe(idlePose === "blink" ? "sleepy" : "happy");
                const idleLine =
                  Math.random() > 0.68
                    ? pickRandom(TECDIA_MESSAGES)
                    : Math.random() > 0.45
                    ? pickRandom(FILIPINO_FOOD_FACTS)
                    : pickRandom(IDLE_MESSAGES);
                showBubble(idleLine, 3400);
              }
            } else {
              setPoseSafe(isTraveling ? "walk" : "sit");
              setExpressionSafe("sleepy");
            }
          } else if (now > motion.actionUntil) {
            setPoseSafe(isTraveling ? "walk" : "sit");
            setExpressionSafe(isTraveling ? "happy" : "curious");
          }
        }

        const idleFloat = motion.entranceComplete ? Math.sin(now / 520) * 4 : 0;
        const walkBounce = poseRef.current === "walk" ? Math.sin(now / 110) * 5 : 0;
        const actionTilt =
          poseRef.current === "spin" ? Math.sin(now / 120) * 12 : motion.lookX * 0.7;

        character.style.width = `${size}px`;
        character.style.height = `${size}px`;
        character.style.transform = `translate3d(${motion.x - size / 2}px, ${motion.y - size / 2 + idleFloat + walkBounce}px, 0) rotate(${actionTilt}deg) scaleX(${facingLeftRef.current ? -1 : 1})`;
        bubbleNode.style.transform = `translate3d(${motion.x - size * 0.46}px, ${motion.y - size - 48}px, 0)`;

        if (leftPupil && rightPupil) {
          leftPupil.setAttribute("transform", `translate(${motion.lookX} ${motion.lookY})`);
          rightPupil.setAttribute("transform", `translate(${motion.lookX} ${motion.lookY})`);
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep, enabled, schedulePose, setExpressionSafe, setFacingSafe, setPoseSafe, showBubble]);

  useEffect(() => {
    return () => {
      clearBubbleTimeout();
      clearDeferredAction();
      stopSpeaking();
      if (poseTimeoutRef.current) {
        window.clearTimeout(poseTimeoutRef.current);
      }
    };
  }, [clearBubbleTimeout, clearDeferredAction, stopSpeaking]);

  const handleCharacterClick = () => {
    if (!enabled) return;
    markInteraction();
    setExpressionSafe("surprised");
    showBubble(pickRandom(CLICK_MESSAGES), 1800);
    schedulePose(Math.random() > 0.5 ? "jump" : "spin", 1100, "sit");
  };

  const handleCharacterHover = () => {
    if (!enabled) return;
    markInteraction();
    setExpressionSafe("curious");
  };

  const toggleMascot = () => {
    setEnabled((current) => {
      const next = !current;
      enabledRef.current = next;

      clearBubbleTimeout();
      clearDeferredAction();

      if (!next) {
        setBubbleVisible(false);
        setPoseSafe("sit");
        stopSpeaking();
      } else {
        markInteraction();
        runDeferred(() => {
          showBubble(sectionMessage, 2200, { interruptSpeech: true });
        });
      }

      return next;
    });
  };

  const eyeScaleY =
    pose === "blink" || expression === "sleepy" ? 0.18 : expression === "surprised" ? 1.08 : 1;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 70,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={toggleMascot}
        style={{
          position: "fixed",
          left: "16px",
          bottom: "16px",
          pointerEvents: "auto",
          border: "1px solid rgba(129, 85, 64, 0.24)",
          background: "rgba(255, 246, 240, 0.92)",
          color: "var(--text-primary)",
          borderRadius: "999px",
          padding: "10px 14px",
          fontSize: "13px",
          fontWeight: 700,
          boxShadow: "0 10px 22px rgba(83, 47, 36, 0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        {enabled ? "Mascot On" : "Mascot Off"}
      </button>

      {enabled && (
        <>
          <div
            ref={bubbleRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              maxWidth: "220px",
              padding: "10px 14px",
              borderRadius: "18px 18px 18px 6px",
              background: "rgba(255, 250, 246, 0.96)",
              border: "1px solid rgba(168, 105, 81, 0.18)",
              color: "var(--text-primary)",
              fontSize: "13px",
              lineHeight: 1.35,
              boxShadow: "0 14px 30px rgba(83, 47, 36, 0.12)",
              backdropFilter: "blur(10px)",
              opacity: bubbleVisible ? 1 : 0,
              transition: "opacity 220ms ease",
              animation: bubbleVisible ? "mascot-bubble-in 260ms ease" : "none",
            }}
          >
            {bubble}
          </div>

          <button
            ref={characterRef}
            type="button"
            aria-label="Interactive halo-halo mascot"
            onClick={handleCharacterClick}
            onMouseEnter={handleCharacterHover}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${CHARACTER_SIZE}px`,
              height: `${CHARACTER_SIZE}px`,
              padding: 0,
              border: "none",
              background: "transparent",
              pointerEvents: "auto",
              cursor: "pointer",
              touchAction: "manipulation",
              filter: "drop-shadow(0 14px 30px rgba(76, 42, 30, 0.18))",
            }}
          >
            <svg viewBox="0 0 160 160" width="100%" height="100%" fill="none" aria-hidden="true">
              <ellipse cx="82" cy="145" rx="34" ry="10" fill="rgba(86, 46, 29, 0.12)" />

              <g
                style={{
                  transformOrigin: "84px 94px",
                  animation:
                    pose === "jump"
                      ? "mascot-jump 900ms cubic-bezier(0.22, 1, 0.36, 1)"
                      : pose === "spin"
                        ? "mascot-spin-pop 900ms cubic-bezier(0.22, 1, 0.36, 1)"
                        : pose === "walk"
                          ? "mascot-walk-bob 520ms linear infinite"
                          : pose === "stretch"
                            ? "mascot-stretch 900ms ease"
                            : "mascot-idle-float 2.8s ease-in-out infinite",
                }}
              >
                <g
                  style={{
                    transformOrigin: "118px 84px",
                    animation:
                      pose === "wave"
                        ? "mascot-tail-wave 620ms ease-in-out 3"
                        : "mascot-tail-swish 2.3s ease-in-out infinite",
                  }}
                >
                  <rect x="116" y="36" width="10" height="68" rx="5" fill="#C68949" />
                  <rect x="118" y="38" width="6" height="64" rx="3" fill="#F0C88B" opacity="0.75" />
                </g>

                <path
                  d="M48 58 C51 46 63 37 80 37 C97 37 109 46 112 58 L116 112 C117 126 105 136 80 136 C55 136 43 126 44 112 Z"
                  fill="#9B5D46"
                />
                <path
                  d="M53 60 C56 50 66 44 80 44 C94 44 104 50 107 60 L110 109 C111 120 101 128 80 128 C59 128 49 120 50 109 Z"
                  fill="#FFE7DB"
                />
                <path
                  d="M56 59 C59 52 68 48 80 48 C92 48 101 52 104 59 L107 79 C99 83 90 85 80 85 C70 85 61 83 53 79 Z"
                  fill="#F5F0FF"
                />
                <ellipse cx="66" cy="61" rx="12" ry="8" fill="#FFB37B" />
                <ellipse cx="92" cy="61" rx="12" ry="8" fill="#E98AB3" />
                <ellipse cx="79" cy="53" rx="14" ry="10" fill="#FFF4FA" />
                <circle cx="59" cy="56" r="5" fill="#8B5CF6" opacity="0.8" />
                <circle cx="99" cy="58" r="5" fill="#FFD65A" opacity="0.88" />
                <circle cx="82" cy="49" r="4" fill="#FF6F61" opacity="0.85" />
                <rect x="38" y="28" width="8" height="70" rx="4" fill="#B7D9E8" />
                <rect x="40" y="30" width="4" height="66" rx="2" fill="#EAF7FD" opacity="0.92" />

                <g
                  style={{
                    transformOrigin: "80px 72px",
                    transform: `scaleY(${eyeScaleY})`,
                    transition: "transform 140ms ease",
                  }}
                >
                  <ellipse cx="70" cy="76" rx="6.4" ry="8.2" fill="#3A221A" />
                  <ellipse cx="90" cy="76" rx="6.4" ry="8.2" fill="#3A221A" />
                  <g ref={pupilLeftRef}>
                    <circle cx="71.5" cy="75" r="2" fill="#FFFFFF" />
                  </g>
                  <g ref={pupilRightRef}>
                    <circle cx="91.5" cy="75" r="2" fill="#FFFFFF" />
                  </g>
                </g>

                <path
                  d="M73 92 C77 96 84 96 88 92"
                  stroke="#8B4F39"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M80 84 L76 89 H84 Z"
                  fill={expression === "surprised" ? "#FF8B7B" : "#8B4F39"}
                />
                <path d="M66 88 L55 85" stroke="#C17C68" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M66 92 L53 92" stroke="#C17C68" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M94 88 L105 85" stroke="#C17C68" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M94 92 L107 92" stroke="#C17C68" strokeWidth="2.5" strokeLinecap="round" />

                <path
                  d="M55 108 C64 114 97 114 105 108"
                  stroke="#E5B29E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M57 116 C67 121 94 121 103 116"
                  stroke="#E5B29E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <g
                  style={{
                    transformOrigin: "48px 102px",
                    animation: pose === "wave" ? "mascot-paw-wave 700ms ease-in-out 2" : "none",
                  }}
                >
                  <path
                    d="M44 103 C40 107 39 114 43 119 C46 123 52 123 56 119 C59 115 59 108 55 103"
                    fill="#FFB37B"
                  />
                  <circle cx="49" cy="113" r="6" fill="#FFD8C2" />
                </g>
                <g
                  style={{
                    transformOrigin: "108px 102px",
                    animation: pose === "point" ? "mascot-point-paw 900ms ease-in-out 2" : "none",
                  }}
                >
                  <path
                    d="M104 103 C100 107 99 114 103 119 C106 123 112 123 116 119 C119 115 119 108 115 103"
                    fill="#E98AB3"
                  />
                  <circle cx="109" cy="113" r="6" fill="#FFD8E8" />
                </g>

                <ellipse cx="68" cy="132" rx="11" ry="8" fill="#FFB37B" />
                <ellipse cx="95" cy="132" rx="11" ry="8" fill="#E98AB3" />
                <ellipse cx="68" cy="135" rx="8" ry="5" fill="#FFD8C2" />
                <ellipse cx="95" cy="135" rx="8" ry="5" fill="#FFD8E8" />

                {expression === "curious" && (
                  <path d="M63 66 C66 62 71 62 74 66" stroke="#8B4F39" strokeWidth="2.8" strokeLinecap="round" />
                )}
                {expression === "curious" && (
                  <path d="M87 66 C90 62 95 62 98 66" stroke="#8B4F39" strokeWidth="2.8" strokeLinecap="round" />
                )}
              </g>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
