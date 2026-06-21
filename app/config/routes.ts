/**
 * Route configuration for the transition demo.
 *
 * Each route defines:
 *  - href:            URL path
 *  - label:           Navigation link text
 *  - transitionTitle: Text shown during page transition
 *  - backgroundColor: Page background color
 */

export type AppRoute = {
  href: string;
  label: string;
  transitionTitle: string;
  backgroundColor: string;
};

export const routes = [
  {
    href: "/",
    label: "Home",
    transitionTitle: "Home",
    backgroundColor: "#0e1e38",
  },
  {
    href: "/about",
    label: "About",
    transitionTitle: "About",
    backgroundColor: "#2e1065",
  },
  {
    href: "/contact",
    label: "Contact",
    transitionTitle: "Contact",
    backgroundColor: "#064e3b",
  },
] as const satisfies readonly AppRoute[];

export const fallbackRoute = routes[0];

export function getRouteByHref(href: string) {
  return routes.find((route) => route.href === href) ?? fallbackRoute;
}
