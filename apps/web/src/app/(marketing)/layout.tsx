import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/architecture", label: "Architecture" },
  { href: "/demo", label: "Demo" },
  { href: "/evidence", label: "Evidence" },
];

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.08] dark:bg-black/80">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            SpendGuard <span className="text-emerald-600">AI</span>
          </Link>
          <ul className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {NAV_LINKS.slice(1).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-black dark:hover:text-zinc-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        {children}
      </main>
      <footer className="border-t border-black/[.08] px-6 py-8 text-center text-xs text-zinc-500 dark:border-white/[.08] dark:text-zinc-500">
        SpendGuard AI is a simulated demo. No real cloud account, credential, or spend is ever touched.
      </footer>
    </div>
  );
}
