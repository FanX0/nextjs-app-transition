"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "../config/routes";

const TRANSITION_DURATION = 700;
const INITIAL_LOAD_DELAY = 500;
const NUM_STAIRS = 6; // Use 6 columns for perfect symmetry (3 left, 3 right)
const STAGGER_DELAY = 0.05;

/* ------------------------------------------------------------------ */
/*  Types & Events                                                     */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";
export type SymmetricDirection = "up" | "down" | "left" | "right";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  SplitStairsTransitionOverlay (private)                             */
/* ------------------------------------------------------------------ */

function SplitStairsTransitionOverlay({ 
  phase, 
  route,
}: { 
  phase: Phase; 
  route: string;
}) {
  const stairs = Array.from({ length: NUM_STAIRS });
  const center = Math.floor(NUM_STAIRS / 2);

  return (
    // 'transition-container-up' uses flex-direction: row for vertical columns
    <div className="transition-container transition-container-up stairs-container">
      {stairs.map((_, i) => {
        // Stagger from left to right
        const delay = i * STAGGER_DELAY;
        const animDelay = phase === "enter" ? `${0.2 + delay}s` : `${delay}s`;

        // Physical movement direction based on which side of the screen it's on
        let stairDirection: string;
        if (i < center) {
          // Left side (Columns 0, 1, 2): slide DOWN from top
          stairDirection = phase === "exit" ? "down" : "up"; // exit=cover screen (down), enter=reveal (up)
        } else {
          // Right side (Columns 3, 4, 5): slide UP from bottom
          stairDirection = phase === "exit" ? "up" : "down"; // exit=cover screen (up), enter=reveal (down)
        }

        const stairClass = phase === "idle" 
          ? `stair-idle-${stairDirection}` 
          : `stair-${phase}-${stairDirection}`;

        // Mask offset to stitch the text together across the vertical columns
        const offset = {
          left: `-${i * (100 / NUM_STAIRS)}vw`,
          top: 0
        };

        return (
          <div
            key={i}
            className={`stair ${stairClass}`}
            style={{ animationDelay: animDelay }}
          >
            <div className="mask-container" style={offset}>
              <p className="route-masked">{route}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SplitStairsTransition (Public API)                                 */
/* ------------------------------------------------------------------ */

/**
 * A Page Transition that uses 5 equal-height blocks with a symmetric stagger.
 * Top and bottom start first, converging on the center.
 *
 * Usage (in layout.tsx):
 *   <SplitStairsTransition direction="left">{children}</SplitStairsTransition>
 */
export function SplitStairsTransition({ 
  children,
}: { 
  children: ReactNode;
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
      className="stairs min-h-screen relative overflow-hidden"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <SplitStairsTransitionOverlay phase={phase} route={routeTitle} />
      {children}
    </main>
  );
}
