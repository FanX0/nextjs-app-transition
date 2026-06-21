"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentProps, type MouseEvent } from "react";
import { getRouteByHref } from "../config/routes";

type TransitionLinkProps = ComponentProps<typeof Link> & {
  href: string;
};

/** Delay before pushing the route (ms). Must match the exit animation duration. */
const EXIT_DURATION = 1000;

/**
 * A drop-in replacement for Next.js <Link> that triggers a
 * page transition animation before navigation.
 *
 * Usage:
 *   <TransitionLink href="/about">About</TransitionLink>
 */
export function TransitionLink({
  href,
  onClick,
  children,
  ...props
}: TransitionLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    // Block clicks while a transition is already running
    const isTransitioning =
      document.body.classList.contains("is-transitioning");

    if (
      isTransitioning ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      href === pathname
    ) {
      if (isTransitioning) event.preventDefault();
      return;
    }

    event.preventDefault();

    // Notify PageTransition to start the exit animation
    window.dispatchEvent(
      new CustomEvent("page-transition-start", {
        detail: {
          href,
          title: getRouteByHref(href).transitionTitle,
        },
      }),
    );

    // Navigate after the exit animation completes
    window.setTimeout(() => router.push(href), EXIT_DURATION);
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
