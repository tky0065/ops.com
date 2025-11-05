import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileNav } from "@/components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DevOps Deployment Accelerator",
  description: "Transform Docker Compose to production-ready Kubernetes and Docker Swarm configurations in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          {/* Navigation */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
              <div className="flex">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold">DevOps Accelerator</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Home
                </Link>
                <Link
                  href="/convert"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Convert
                </Link>
                <Link
                  href="/projects"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Projects
                </Link>
                <Link
                  href="/templates"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Templates
                </Link>
                <Link
                  href="/docs"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Docs
                </Link>
              </nav>

              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Built by{' '}
                  <a
                    href="https://enokdev-com.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-foreground transition-colors"
                  >
                    EnokDev
                  </a>
                </p>
                <span className="hidden md:inline text-muted-foreground">•</span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <a
                    href="https://app.enokdev.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    InonClic
                  </a>
                  <span>•</span>
                  <a
                    href="https://idea2mvp.enokdev.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Idea2MVP
                  </a>
                  <span>•</span>
                  <a
                    href="https://github.com/tky0065"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} DevOps Deployment Accelerator
              </p>
            </div>
          </footer>
        </div>

        {/* Toast Notifications */}
        <Toaster />
      </body>
    </html>
  );
}
