import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurveTransition } from "./components/CurveTransition";
import { SlideTransition } from "./components/SlideTransition";
import { StairsTransition } from "./components/StairsTransition";
import { SplitStairsTransition } from "./components/SplitStairsTransition";
import { HorizontalSplitStairsTransition } from "./components/HorizontalSplitStairsTransition";
import { VerticalSplitStairsTransition } from "./components/VerticalSplitStairsTransition";
import { HorizontalSplitBoxTransition } from "./components/HorizontalSplitBoxTransition";
import { VerticalSplitBoxTransition } from "./components/VerticalSplitBoxTransition";
import { TransitionLink } from "./components/TransitionLink";
import { routes } from "./config/routes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mindory Transition Demo",
  description: "A reusable App Router page transition demo without Framer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full text-black" suppressHydrationWarning>
        <header className="header">
          {routes.map((route) => (
            <TransitionLink key={route.href} href={route.href}>
              {route.label}
            </TransitionLink>
          ))}
        </header>

        {/* 
          To change the page transition, swap the wrapper below.
          All transitions support direction="up" | "down" | "left" | "right":

          1. <SlideTransition direction="up">{children}</SlideTransition>
          2. <StairsTransition direction="left">{children}</StairsTransition>
          3. <SplitTransition direction="up">{children}</SplitTransition>
          4. <CurveTransition direction="up">{children}</CurveTransition>
          5. <SplitStairsTransition>{children}</SplitStairsTransition>
          6. <HorizontalSplitStairsTransition>{children}</HorizontalSplitStairsTransition>
          7. <VerticalSplitStairsTransition>{children}</VerticalSplitStairsTransition>
          8. <HorizontalSplitBoxTransition>{children}</HorizontalSplitBoxTransition>
          9. <VerticalSplitBoxTransition>{children}</VerticalSplitBoxTransition>
        */}
        <VerticalSplitBoxTransition>{children}</VerticalSplitBoxTransition>
      </body>
    </html>
  );
}
