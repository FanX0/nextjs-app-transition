"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "../config/routes";

const TRANSITION_DURATION = 700;
const INITIAL_LOAD_DELAY = 500;

/* ------------------------------------------------------------------ */
/*  Types & Events                                                     */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";
export type SplitDirection = "up" | "down" | "left" | "right";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  SplitTransitionOverlay (private)                                   */
/* ------------------------------------------------------------------ */

function SplitTransitionOverlay({ 
  phase, 
  route,
  direction,
}: { 
  phase: Phase; 
  route: string;
  direction: SplitDirection;
}) {
  const isHorizontal = direction === "left" || direction === "right";

  return (
    <>
      <div className={`transition-container transition-container-${direction}`}>
        {/* Panel 1 */}
        <div className={`split-panel split-panel-${phase}-${direction}-1`}>
          <div className="mask-container" style={{ left: 0, top: 0 }}>
            <p className="route-masked">{route}</p>
          </div>
        </div>
        {/* Panel 2 */}
        <div className={`split-panel split-panel-${phase}-${direction}-2`}>
          <div 
            className="mask-container" 
            style={{ 
              left: isHorizontal ? 0 : '-50vw', 
              top: isHorizontal ? '-50vh' : 0 
            }}
          >
            <p className="route-masked">{route}</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SplitTransition (Public API)                                       */
/* ------------------------------------------------------------------ */

/**
 * A highly-customizable Page Transition that splits the screen in half.
 *
 * Usage (in layout.tsx):
 *   <SplitTransition direction="up">{children}</SplitTransition>
 */
export function SplitTransition({ 
  children,
  direction = "up"
}: { 
  children: ReactNode;
  direction?: SplitDirection;
}) {
  const pathname = usePathname();
  const currentRoute = getRouteByHref(pathname);
  const [phase, setPhase] = useState<Phase>("enter");
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
      className="split min-h-screen relative overflow-hidden"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <SplitTransitionOverlay phase={phase} route={routeTitle} direction={direction} />
      {children}
    </main>
  );
}
