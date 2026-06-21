"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "../config/routes";

const TRANSITION_DURATION = 700;
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
/*  VerticalSplitStairsOverlay (private)                               */
/* ------------------------------------------------------------------ */

function VerticalSplitStairsOverlay({ 
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
        // Stagger from top to bottom
        const delay = i * STAGGER_DELAY;
        const animDelay = phase === "enter" ? `${0.2 + delay}s` : `${delay}s`;
        
        // Use a generic cubic-bezier for the sliding, combining the delay into the shorthand
        const transitionStyle = phase === "idle" ? "none" : `transform 0.5s cubic-bezier(0.76, 0, 0.24, 1) ${animDelay}`;

        // Left half: slides RIGHT to the center
        const leftTransform = phase === "idle" ? "translateX(-55vw)" : (phase === "enter" ? "translateX(-55vw)" : "translateX(0)");
        const leftInverseTransform = phase === "idle" ? "translateX(55vw)" : (phase === "enter" ? "translateX(55vw)" : "translateX(0)");

        // Right half: slides LEFT to the center
        const rightTransform = phase === "idle" ? "translateX(55vw)" : (phase === "enter" ? "translateX(55vw)" : "translateX(0)");
        const rightInverseTransform = phase === "idle" ? "translateX(-55vw)" : (phase === "enter" ? "translateX(-55vw)" : "translateX(0)");

        return (
          <div key={i} style={{ position: "absolute", top: `${i * 20}vh`, left: 0, width: "100vw", height: "calc(20vh + 1px)" }}>
            
            {/* Left Column */}
            <div 
              style={{
                position: "absolute",
                top: 0, left: 0, width: "calc(50vw + 2px)", height: "100%",
                backgroundColor: "black",
                overflow: "hidden",
                transform: leftTransform,
                transition: transitionStyle,
              }}
            >
              <div className="mask-container" style={{ position: "absolute", top: `-${i * 20}vh`, left: 0, width: "100vw", height: "100vh", transform: leftInverseTransform, transition: transitionStyle }}>
                <p className="route-masked">{route}</p>
              </div>
            </div>

            {/* Right Column */}
            <div 
              style={{
                position: "absolute",
                top: 0, right: 0, width: "calc(50vw + 2px)", height: "100%",
                backgroundColor: "black",
                overflow: "hidden",
                transform: rightTransform,
                transition: transitionStyle,
              }}
            >
              <div className="mask-container" style={{ position: "absolute", top: `-${i * 20}vh`, left: "calc(-50vw + 2px)", width: "100vw", height: "100vh", transform: rightInverseTransform, transition: transitionStyle }}>
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
/*  VerticalSplitStairsTransition (Public API)                         */
/* ------------------------------------------------------------------ */

export function VerticalSplitStairsTransition({ 
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
  useEffect(() => {
    const enterTimeout = window.setTimeout(() => {
      setTransitionTitle(null);
      setPhase("enter");
    }, 0);

    const idleTimeout = window.setTimeout(() => {
      setPhase("idle");
    }, TRANSITION_DURATION);

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
      <VerticalSplitStairsOverlay phase={phase} route={routeTitle} />
      {children}
    </main>
  );
}
