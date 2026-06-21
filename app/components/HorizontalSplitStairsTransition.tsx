"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "../config/routes";

const TRANSITION_DURATION = 700;
const INITIAL_LOAD_DELAY = 500;
const STAGGER_DELAY = 0.05;

/* ------------------------------------------------------------------ */
/*  Types & Events                                                     */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  HorizontalSplitStairsOverlay (private)                             */
/* ------------------------------------------------------------------ */

function HorizontalSplitStairsOverlay({ 
  phase, 
  route,
}: { 
  phase: Phase; 
  route: string;
}) {
  const NUM_STAIRS = 5;
  const stairs = Array.from({ length: NUM_STAIRS });

  return (
    <div className="transition-container stairs-container" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 999 }}>
      {stairs.map((_, i) => {
        // Stagger from left to right
        const delay = i * STAGGER_DELAY;
        const animDelay = phase === "enter" ? `${0.2 + delay}s` : `${delay}s`;
        
        // Use a generic cubic-bezier for the sliding, combining the delay into the shorthand
        const transitionStyle = phase === "idle" ? "none" : `transform 0.5s cubic-bezier(0.76, 0, 0.24, 1) ${animDelay}`;

        // Top half: slides DOWN from top
        const topTransform = phase === "idle" ? "translateY(-105%)" : (phase === "enter" ? "translateY(-105%)" : "translateY(0)");
        
        // Bottom half: slides UP from bottom
        const bottomTransform = phase === "idle" ? "translateY(105%)" : (phase === "enter" ? "translateY(105%)" : "translateY(0)");

        return (
          <div key={i} style={{ position: "absolute", top: 0, left: `${i * (100 / NUM_STAIRS)}vw`, width: `${100 / NUM_STAIRS}vw`, height: "100vh" }}>
            
            {/* Top Column */}
            <div 
              style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: "50%",
                backgroundColor: "black",
                overflow: "hidden",
                transform: topTransform,
                transition: transitionStyle,
              }}
            >
              <div className="mask-container" style={{ position: "absolute", top: 0, left: `-${i * 100}%`, width: "100vw", height: "100vh" }}>
                <p className="route-masked">{route}</p>
              </div>
            </div>

            {/* Bottom Column */}
            <div 
              style={{
                position: "absolute",
                bottom: 0, left: 0, width: "100%", height: "50%",
                backgroundColor: "black",
                overflow: "hidden",
                transform: bottomTransform,
                transition: transitionStyle,
              }}
            >
              <div className="mask-container" style={{ position: "absolute", top: "-50vh", left: `-${i * 100}%`, width: "100vw", height: "100vh" }}>
                <p className="route-masked">{route}</p>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HorizontalSplitStairsTransition (Public API)                       */
/* ------------------------------------------------------------------ */

export function HorizontalSplitStairsTransition({ 
  children,
}: { 
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentRoute = getRouteByHref(pathname);
  
  // Initialize to "exit" so the first load starts covered and animates open!
  const [phase, setPhase] = useState<Phase>("exit");
  const [transitionTitle, setTransitionTitle] = useState<string | null>(null);
  const routeTitle = transitionTitle ?? currentRoute.transitionTitle;

  // On route change → enter phase, then idle
  const isInitialMount = useRef(true);

  useEffect(() => {
    const delay = isInitialMount.current ? INITIAL_LOAD_DELAY : 0;
    isInitialMount.current = false;

    const enterTimeout = window.setTimeout(() => {
      setTransitionTitle(null);
      setPhase("enter");
    }, delay);

    const idleTimeout = window.setTimeout(() => {
      setPhase("idle");
    }, delay + TRANSITION_DURATION);

    return () => {
      window.clearTimeout(enterTimeout);
      window.clearTimeout(idleTimeout);
    };
  }, [pathname]);

  // Listen for exit trigger from TransitionLink
  useEffect(() => {
    function handleTransitionStart(event: Event) {
      const { title } = (event as TransitionStartEvent).detail;
      setTransitionTitle(title);
      setPhase("exit");
    }

    window.addEventListener("page-transition-start", handleTransitionStart);
    return () => {
      window.removeEventListener("page-transition-start", handleTransitionStart);
    };
  }, []);

  // Block interactions during exit animation
  useEffect(() => {
    const method = phase === "exit" ? "add" : "remove";
    document.body.classList[method]("is-transitioning");
    return () => document.body.classList.remove("is-transitioning");
  }, [phase]);

  return (
    <main
      className="stairs min-h-screen relative overflow-hidden"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <HorizontalSplitStairsOverlay phase={phase} route={routeTitle} />
      {children}
    </main>
  );
}
