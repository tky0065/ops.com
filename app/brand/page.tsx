import Image from 'next/image';
import Link from 'next/link';

export default function BrandPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Brand Assets</h1>
        <p className="text-lg text-muted-foreground">
          Logo variations and visual identity for DevOps Accelerator
        </p>
      </div>

      {/* Primary Logos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Primary Logos</h2>

        {/* Light Mode Logo */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Light Mode Logo</h3>
          <div className="bg-white border rounded-lg p-8 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="DevOps Accelerator Logo - Light"
              width={240}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            File: <code className="bg-muted px-2 py-1 rounded">/public/logo.svg</code> • 240x48px
          </p>
        </div>

        {/* Dark Mode Logo */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Dark Mode Logo</h3>
          <div className="bg-slate-900 border rounded-lg p-8 flex items-center justify-center">
            <Image
              src="/logo-dark.svg"
              alt="DevOps Accelerator Logo - Dark"
              width={240}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            File: <code className="bg-muted px-2 py-1 rounded">/public/logo-dark.svg</code> • 240x48px
          </p>
        </div>
      </section>

      {/* Icon Variations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Icon Variations</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Icon */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Icon</h3>
            <div className="bg-white border rounded-lg p-8 flex items-center justify-center">
              <Image
                src="/icon.svg"
                alt="DevOps Accelerator Icon"
                width={64}
                height={64}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-1 rounded">icon.svg</code> • 64x64px
            </p>
          </div>

          {/* Favicon */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Favicon</h3>
            <div className="bg-white border rounded-lg p-8 flex items-center justify-center">
              <Image
                src="/favicon.svg"
                alt="Favicon"
                width={32}
                height={32}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-1 rounded">favicon.svg</code> • 32x32px
            </p>
          </div>

          {/* Apple Touch Icon */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Apple Touch</h3>
            <div className="bg-white border rounded-lg p-8 flex items-center justify-center">
              <Image
                src="/apple-touch-icon.svg"
                alt="Apple Touch Icon"
                width={90}
                height={90}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-1 rounded">apple-touch-icon.svg</code> • 180x180px
            </p>
          </div>
        </div>
      </section>

      {/* OG Image */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Social Media</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Open Graph Image</h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <Image
              src="/og-image.svg"
              alt="OG Image"
              width={1200}
              height={630}
              className="w-full h-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            File: <code className="bg-muted px-2 py-1 rounded">/public/og-image.svg</code> • 1200x630px (Twitter, Facebook, LinkedIn)
          </p>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Color Palette</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tech Blue */}
          <div className="space-y-3">
            <div className="bg-[#2563eb] rounded-lg p-8 flex items-center justify-center border">
              <span className="text-white font-bold text-xl">Tech Blue</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>HEX:</strong> <code className="bg-muted px-2 py-1 rounded">#2563eb</code></p>
              <p><strong>Usage:</strong> Primary actions, Kubernetes segment, trust</p>
            </div>
          </div>

          {/* DevOps Orange */}
          <div className="space-y-3">
            <div className="bg-[#ff6b35] rounded-lg p-8 flex items-center justify-center border">
              <span className="text-white font-bold text-xl">DevOps Orange</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>HEX:</strong> <code className="bg-muted px-2 py-1 rounded">#ff6b35</code></p>
              <p><strong>Usage:</strong> Accents, Docker segment, energy</p>
            </div>
          </div>
        </div>

        {/* Gradient */}
        <div className="space-y-3">
          <div
            className="rounded-lg p-8 flex items-center justify-center border"
            style={{
              background: 'linear-gradient(90deg, #ff6b35 0%, #2563eb 100%)'
            }}
          >
            <span className="text-white font-bold text-xl">Pipeline Gradient</span>
          </div>
          <div className="text-sm">
            <p><strong>CSS:</strong> <code className="bg-muted px-2 py-1 rounded">linear-gradient(90deg, #ff6b35 0%, #2563eb 100%)</code></p>
            <p><strong>Usage:</strong> Conversion engine visualization</p>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Documentation</h2>
        <div className="bg-muted rounded-lg p-6 space-y-3">
          <p className="text-sm">
            For complete brand guidelines, usage rules, and file format specifications, see:
          </p>
          <a
            href="/BRAND.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity text-sm"
          >
            View Brand Guidelines (BRAND.md)
          </a>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 pb-4 border-t">
        <p className="text-sm text-muted-foreground text-center">
          All brand assets © 2024 DevOps Accelerator
        </p>
      </div>
    </div>
  );
}
