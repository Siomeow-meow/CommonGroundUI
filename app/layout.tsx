import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "./components/NavBar";
import MobileNav from "./components/MobileNav";
import AppBody from "./components/AppBody";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CommonGround",
  description: "Social platform",
};

// Inline script string — kept outside JSX so React never sees a <script> element
// at render time; it's injected via dangerouslySetInnerHTML on a plain <div> wrapper
// trick doesn't work either. The correct Next.js 13+ pattern is Script with strategy="beforeInteractive"
// but the simplest zero-dep approach is to default to "dark" in the className and let
// the client NavBar correct it after mount if localStorage says otherwise.
// No flash on first load (dark is the design default).

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Start with "dark" — NavBar's useThemeToggle reads localStorage on mount
      // and switches to "light" if the user previously chose it. The class is on
      // <html> so CSS variables update instantly without a layout shift.
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <AppBody>
        <ClerkProvider>
          <NavBar />
          {children}
          <MobileNav />
        </ClerkProvider>
      </AppBody>
    </html>
  );
}
