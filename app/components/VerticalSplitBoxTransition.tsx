"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "../config/routes";

const TRANSITION_DURATION = 500;

/* ------------------------------------------------------------------ */
/*  Types & Events                                                     */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  VerticalSplitBoxOverlay (private)                                  */
/* ------------------------------------------------------------------ */

function VerticalSplitBoxOverlay({ 
  phase, 
  route,
}: { 
  phase: Phase; 
  route: string;
}) {
  return (
    <div className="transition-container stairs-container" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 999 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh" }}>
        
        {/* Left Half */}
        <div 
          style={{
            position: "absolute",
            top: 0, left: 0, width: "calc(50vw + 2px)", height: "100%",
            backgroundColor: "black",
            overflow: "hidden",
            transform: phase === "idle" ? "translateX(-55vw)" : (phase === "enter" ? "translateX(-55vw)" : "translateX(0)"),
            transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)",
          }}
        >
          <div className="mask-container" style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", transform: phase === "idle" ? "translateX(55vw)" : (phase === "enter" ? "translateX(55vw)" : "translateX(0)"), transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)" }}>
            <p className="route-masked">
              {route}
            </p>
          </div>
        </div>

        {/* Right Half */}
        <div 
          style={{
            position: "absolute",
            top: 0, right: 0, width: "calc(50vw + 2px)", height: "100%",
            backgroundColor: "black",
            overflow: "hidden",
            transform: phase === "idle" ? "translateX(55vw)" : (phase === "enter" ? "translateX(55vw)" : "translateX(0)"),
            transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)",
          }}
        >
          <div className="mask-container" style={{ position: "absolute", top: 0, left: "calc(-50vw + 2px)", width: "100vw", height: "100vh", transform: phase === "idle" ? "translateX(-55vw)" : (phase === "enter" ? "translateX(-55vw)" : "translateX(0)"), transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)" }}>
            <p className="route-masked">
              {route}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VerticalSplitBoxTransition (Public API)                            */
/* ------------------------------------------------------------------ */

export function VerticalSplitBoxTransition({ 
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
    const method = phase !== "idle" ? "add" : "remove";
    document.body.classList[method]("is-transitioning");
    return () => document.body.classList.remove("is-transitioning");
  }, [phase]);

  return (
    <main
      className="stairs min-h-screen relative overflow-hidden"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <VerticalSplitBoxOverlay phase={phase} route={routeTitle} />
      {children}
    </main>
  );
}
