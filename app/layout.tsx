import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ops.com'),
  title: "DevOps Deployment Accelerator | Docker Compose to Kubernetes",
  description: "Transform Docker Compose to production-ready Kubernetes and Docker Swarm configurations in minutes. Auto-generate reverse proxy configs, health checks, and security best practices.",
  keywords: ["DevOps", "Kubernetes", "Docker", "Docker Compose", "K8s", "Deployment", "Automation", "Traefik", "Nginx"],
  authors: [{ name: "EnokDev", url: "https://enokdev-com.vercel.app/" }],
  openGraph: {
    title: "DevOps Deployment Accelerator",
    description: "Transform Docker Compose to production-ready Kubernetes in minutes",
    url: "https://ops.com",
    siteName: "DevOps Accelerator",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "DevOps Accelerator - Docker to Kubernetes",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevOps Deployment Accelerator",
    description: "Transform Docker Compose to production-ready Kubernetes in minutes",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          {/* Navigation */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
              <div className="flex">
                <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/logo.svg"
                    alt="DevOps Accelerator Logo"
                    width={180}
                    height={36}
                    className="h-9 w-auto dark:hidden"
                    priority
                  />
                  <Image
                    src="/logo-dark.svg"
                    alt="DevOps Accelerator Logo"
                    width={180}
                    height={36}
                    className="h-9 w-auto hidden dark:block"
                    priority
                  />
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
