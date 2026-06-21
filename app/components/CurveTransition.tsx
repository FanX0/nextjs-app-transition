"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getRouteByHref } from "../config/routes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = "enter" | "exit" | "idle";
export type CurveDirection = "up" | "down" | "left" | "right";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Curve overshoot above path origin (px). */
const CURVE_OVERSHOOT = 300;

/** Extra height below viewport for the bottom curve (px). */
const BOTTOM_EXTEND = 400;

/** Maximum curve amplitude for the bottom bulge (px). */
const BOTTOM_AMPLITUDE = 600;

/** Total duration before phase resets to idle (ms). */
const TRANSITION_DURATION = 700;

/* ------------------------------------------------------------------ */
/*  SVG path builders                                                  */
/* ------------------------------------------------------------------ */

/**
 * Builds the "full coverage" path — used as the starting shape on enter
 * and the ending shape on exit.
 *
 * Shape: top convex curve → right edge → bottom concave curve → left edge
 */
function getInitialPath(w: number, h: number) {
  return `
    M0 0
    Q${w / 2} -${CURVE_OVERSHOOT} ${w} 0
    L${w} ${h + BOTTOM_EXTEND}
    Q${w / 2} ${h + BOTTOM_AMPLITUDE} 0 ${h + BOTTOM_EXTEND}
    Z
  `;
}

/**
 * Builds the "collapsed" path — the ending shape on enter (curve
 * flattened at viewport bottom) and starting shape on exit.
 */
function getTargetPath(w: number, h: number) {
  return `
    M0 0
    Q${w / 2} -${CURVE_OVERSHOOT} ${w} 0
    L${w} ${h}
    Q${w / 2} ${h} 0 ${h}
    Z
  `;
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useViewportSize() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

/* ------------------------------------------------------------------ */
/*  TransitionOverlay (private)                                        */
/* ------------------------------------------------------------------ */

function TransitionOverlay({ 
  phase, 
  route,
  direction,
}: { 
  phase: Phase; 
  route: string;
  direction: CurveDirection;
}) {
  const viewport = useViewportSize();

  const paths = useMemo(() => {
    if (!viewport) return null;
    
    // For horizontal sweeps, we treat the screen height as the SVG's width
    const isHorizontal = direction === "left" || direction === "right";
    const w = isHorizontal ? viewport.height : viewport.width;
    const h = isHorizontal ? viewport.width : viewport.height;

    return {
      initial: getInitialPath(w, h),
      target: getTargetPath(w, h),
    };
  }, [viewport, direction]);

  if (!viewport || !paths) {
    return <div className="transition-background" style={{ opacity: 1 }} />;
  }

  const { width, height } = viewport;
  const isHorizontal = direction === "left" || direction === "right";
  const w = isHorizontal ? height : width;
  const h = isHorizontal ? width : height;

  return (
    <>
      <div className={`curve-rotator curve-rotator-${direction}`}>
        <div
          className="transition-background"
          style={{ opacity: 0 }}
        />

        <svg
          key={`${phase}-${w}-${h}`}
          className={`transition-svg transition-svg-${phase}`}
          viewBox={`0 -${CURVE_OVERSHOOT} ${w} ${h + CURVE_OVERSHOOT + BOTTOM_AMPLITUDE}`}
          preserveAspectRatio="none"
        >
          <defs>
            <path id={`curve-path-${phase}`} d={phase === "enter" ? paths.initial : paths.target}>
              {phase === "enter" && (
                <animate
                  attributeName="d"
                  from={paths.initial}
                  to={paths.target}
                  dur="0.5s"
                  begin="0.2s"
                  calcMode="spline"
                  keySplines="0.76 0 0.24 1"
                  fill="freeze"
                />
              )}
              {phase === "exit" && (
                <animate
                  attributeName="d"
                  from={paths.target}
                  to={paths.initial}
                  dur="0.5s"
                  calcMode="spline"
                  keySplines="0.76 0 0.24 1"
                  fill="freeze"
                />
              )}
            </path>
            <clipPath id={`curve-clip-${phase}`}>
              <use href={`#curve-path-${phase}`} />
            </clipPath>
          </defs>

          <use href={`#curve-path-${phase}`} fill="black" />

          <text
            x={w / 2}
            y={h / 2}
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
            clipPath={`url(#curve-clip-${phase})`}
            className="route-masked-svg"
          >
            {route}
          </text>
        </svg>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  PageTransition (public)                                            */
/* ------------------------------------------------------------------ */

/**
 * Wrap page content with this component to get an animated curve
 * transition on every route change.
 *
 * Usage (in layout.tsx):
 *   <CurveTransition direction="right">{children}</CurveTransition>
 */
export function CurveTransition({ 
  children,
  direction = "up"
}: { 
  children: ReactNode;
  direction?: CurveDirection;
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
      className="page curve"
      style={{ backgroundColor: currentRoute.backgroundColor }}
    >
      {phase === "exit" && <div className="transition-blocker" />}
      <TransitionOverlay phase={phase} route={routeTitle} direction={direction} />
      {children}
    </main>
  );
}
