# Next.js App Router Transitions

This project demonstrates how to build and orchestrate smooth, professional-grade page transitions in the **Next.js App Router** using **Framer Motion**. It features a robust architecture that completely bypasses the limitations of the App Router's lack of native exit animations.

## 🚀 Step-by-Step Usage Guide

Follow these steps to add and use page transitions in your Next.js application:

### Step 1: Wrap Your Pages
To animate a page when it loads, you must wrap its contents with one of the provided transition components. 

For example, if you want to use the `CurveTransition` on your About page:

```tsx
// app/about/page.tsx
import { CurveTransition } from "@/components/CurveTransition";

export default function AboutPage() {
  return (
    <CurveTransition>
      <main className="p-10">
        <h1>About Us</h1>
        <p>This page loaded with a beautiful curve transition!</p>
      </main>
    </CurveTransition>
  )
}
```

*Available Transition Components:*
- `CurveTransition`
- `SlideTransition`
- `HorizontalSplitBoxTransition`
- `HorizontalSplitStairsTransition`
- `VerticalSplitBoxTransition`
- `VerticalSplitStairsTransition`
- `SplitStairsTransition`
- `SplitTransition`
- `StairsTransition`

### Step 2: Use the Custom `<TransitionLink />`
Because the Next.js App Router unmounts pages instantly, standard `<Link>` components will skip the exit animation. 

Instead, you **must** use the custom `<TransitionLink>` component whenever you want to trigger a transition to a new page.

```tsx
// app/components/Navigation.tsx
import { TransitionLink } from "@/components/TransitionLink";

export default function Navigation() {
  return (
    <nav>
      {/* ❌ DON'T use next/link */}
      {/* <Link href="/about">About</Link> */}

      {/* ✅ DO use TransitionLink */}
      <TransitionLink href="/about" className="text-blue-500">
        Go to About Page
      </TransitionLink>
    </nav>
  )
}
```

### Step 3: Configure Route Names (Optional)
Many of the transition animations (like the split variants) display the name of the route in the center of the screen while the transition is happening. 

To make sure the correct text is displayed, define your routes in `app/config/routes.ts`:

```typescript
// app/config/routes.ts
export const routes = [
  { href: "/", name: "Home" },
  { href: "/about", name: "About Us" },
  { href: "/contact", name: "Contact" },
];

export const getRouteByHref = (href: string) => {
  return routes.find((route) => route.href === href)?.name || "Page";
};
```

---

## 🏗️ How it Works (Under the Hood)

1. **User Clicks a Link**: The user clicks a `<TransitionLink>`.
2. **Click Intercepted**: `TransitionLink` prevents standard routing (`e.preventDefault()`).
3. **Trigger Exit Animation**: It adds an `.is-transitioning` class to the body. This signals Framer Motion to start playing the *exit* animation for the current page wrapper.
4. **Lock User Interaction**: The UI is locked so the user cannot click other links while the animation plays.
5. **Delay Routing**: `TransitionLink` waits for exactly `1000ms` (the length of the exit animation).
6. **Navigate**: Finally, it calls `router.push(href)` to change the URL.
7. **Enter Animation**: The new page loads, and its transition wrapper automatically plays the *enter* animation.

## 💻 Getting Started

First, install dependencies:
```bash
pnpm install
```

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the smooth transitions in action!