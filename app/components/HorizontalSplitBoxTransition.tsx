import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getRouteByHref } from "@/config/routes";

const TRANSITION_DURATION = 500;

type Phase = "enter" | "exit" | "idle";

type TransitionStartEvent = CustomEvent<{
  href: string;
  title: string;
}>;

function HorizontalSplitBoxOverlay({ 
  phase, 
  route,
}: { 
  phase: Phase; 
  route: string;
}) {
  return (
    <div className="transition-container stairs-container" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 2 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh" }}>
        
        {/* Top Half */}
        <div 
          style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "calc(50vh + 2px)",
            backgroundColor: "black",
            overflow: "hidden",
            transform: phase === "idle" ? "translateY(-55vh)" : (phase === "enter" ? "translateY(-55vh)" : "translateY(0)"),
            transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)",
          }}
        >
          <div className="mask-container" style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", transform: phase === "idle" ? "translateY(55vh)" : (phase === "enter" ? "translateY(55vh)" : "translateY(0)"), transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)" }}>
            <p className="route-masked">
              {route}
            </p>
          </div>
        </div>

        {/* Bottom Half */}
        <div 
          style={{
            position: "absolute",
            bottom: 0, left: 0, width: "100%", height: "calc(50vh + 2px)",
            backgroundColor: "black",
            overflow: "hidden",
            transform: phase === "idle" ? "translateY(55vh)" : (phase === "enter" ? "translateY(55vh)" : "translateY(0)"),
            transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)",
          }}
        >
          <div className="mask-container" style={{ position: "absolute", top: "calc(-50vh + 2px)", left: 0, width: "100vw", height: "100vh", transform: phase === "idle" ? "translateY(-55vh)" : (phase === "enter" ? "translateY(-55vh)" : "translateY(0)"), transition: phase === "idle" ? "none" : "transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)" }}>
            <p className="route-masked">
              {route}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export function HorizontalSplitBoxTransition({ 
  children,
}: { 
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentRoute = getRouteByHref(pathname);
  
  const [phase, setPhase] = useState<Phase>("exit");
  const [transitionTitle, setTransitionTitle] = useState<string | null>(null);
  const routeTitle = transitionTitle ?? currentRoute.transitionTitle;

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
      <HorizontalSplitBoxOverlay phase={phase} route={routeTitle} />
      {children}
    </main>
  );
}
