import { cn } from "@/lib/cn";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh w-full">
      {/* Settings sidebar */}
      <aside
        className={cn(
          "hidden sm:flex flex-col w-[240px] border-r border-border-subtle bg-bg-primary",
          "safe-top safe-bottom"
        )}
      >
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        </div>
        <nav className="flex-1 px-2">
          <a
            href="/settings/profile"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              "text-text-primary bg-bg-tertiary/50"
            )}
          >
            Profile
          </a>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-bg-secondary">
        {children}
      </main>
    </div>
  );
}
