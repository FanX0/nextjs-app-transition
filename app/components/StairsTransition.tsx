"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getRouteByHref } from "../config/routes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";
export type StairsDirection = "up" | "down" | "left" | "right";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Total duration before phase resets to idle (ms). */
const TRANSITION_DURATION = 700;

/** Number of stairs/columns. */
const NUM_STAIRS = 5;

/** Delay increment between each stair animating (seconds). */
const STAGGER_DELAY = 0.05;

/* ------------------------------------------------------------------ */
/*  StairsTransitionOverlay (private)                                  */
/* ------------------------------------------------------------------ */

function StairsTransitionOverlay({ 
  phase, 
  route,
  direction,
}: { 
  phase: Phase; 
  route: string;
  direction: StairsDirection;
}) {
  // Create an array of length NUM_STAIRS
  const stairs = Array.from({ length: NUM_STAIRS });
  const isHorizontal = direction === "left" || direction === "right";

  return (
    <>
      <div className={`transition-container transition-container-${direction}`}>
        {stairs.map((_, i) => {
          // Stagger from left to right
          const delay = i * STAGGER_DELAY;
          
          return (
            <div
              key={i}
              className={`stair stair-${phase}-${direction}`}
              style={{
                // Start enter animation after 0.2s to match route text timing,
                // plus the stagger. Exit starts immediately + stagger.
                animationDelay: phase === "enter" ? `${0.2 + delay}s` : `${delay}s`,
              }}
            >
              <div 
                className="mask-container" 
                style={{ 
                  left: isHorizontal ? 0 : `-${i * (100 / NUM_STAIRS)}vw`, 
                  top: isHorizontal ? `-${i * (100 / NUM_STAIRS)}vh` : 0 
                }}
              >
                <p className="route-masked">{route}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  StairsTransition (public)                                          */
/* ------------------------------------------------------------------ */

/**
 * Wrap page content with this component to get an animated "stairs"
 * transition on every route change.
 *
 * Usage (in layout.tsx):
 *   <StairsTransition direction="right">{children}</StairsTransition>
 */
export function StairsTransition({ 
  children,
  direction = "up"
}: { 
  children: ReactNode;
  direction?: StairsDirection;
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
    const method = phase === "exit" ? "add" : "remove";
    document.body.classList[method]("is-transitioning");
    return () => document.body.classList.remove("is-transitioning");
  }, [phase]);

  return (
    <main
      className="page stairs"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <StairsTransitionOverlay phase={phase} route={routeTitle} direction={direction} />
      {children}
    </main>
  );
}
