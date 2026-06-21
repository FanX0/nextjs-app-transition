"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getRouteByHref } from "../config/routes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";
export type SlideDirection = "up" | "down" | "left" | "right";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Total duration before phase resets to idle (ms). */
const TRANSITION_DURATION = 700;

/* ------------------------------------------------------------------ */
/*  SlideTransitionOverlay (private)                                   */
/* ------------------------------------------------------------------ */

function SlideTransitionOverlay({ 
  phase, 
  route,
  direction,
}: { 
  phase: Phase; 
  route: string;
  direction: SlideDirection;
}) {
  return (
    <>
      <div className={`transition-box transition-box-${phase}-${direction}`}>
        <div className="mask-container">
          <p className="route-masked">{route}</p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SlideTransition (public)                                           */
/* ------------------------------------------------------------------ */

/**
 * Wrap page content with this component to get an animated slide "box"
 * transition on every route change.
 *
 * Usage (in layout.tsx):
 *   <SlideTransition direction="right">{children}</SlideTransition>
 */
export function SlideTransition({ 
  children, 
  direction = "up" 
}: { 
  children: ReactNode;
  direction?: SlideDirection;
}) {
  const pathname = usePathname();
  const currentRoute = getRouteByHref(pathname);
  const [phase, setPhase] = useState<Phase>("enter");
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
      className="page slide"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <SlideTransitionOverlay phase={phase} route={routeTitle} direction={direction} />
      {children}
    </main>
  );
}
