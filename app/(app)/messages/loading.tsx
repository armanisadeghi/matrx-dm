export default function MessagesLoading() {
  return (
    <div className="flex h-dvh w-full bg-bg-primary">
      {/* Sidebar skeleton */}
      <div className="flex w-full flex-col lg:w-[320px] lg:border-r lg:border-border-subtle">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="h-6 w-24 rounded animate-shimmer" />
          <div className="h-8 w-8 rounded-full animate-shimmer" />
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="h-9 w-full rounded-lg animate-shimmer" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pb-3">
          <div className="h-7 w-12 rounded-full animate-shimmer" />
          <div className="h-7 w-16 rounded-full animate-shimmer" />
          <div className="h-7 w-16 rounded-full animate-shimmer" />
        </div>

        {/* Conversation items */}
        <div className="flex flex-col gap-1 px-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded animate-shimmer" />
                  <div className="h-3 w-10 rounded animate-shimmer" />
                </div>
                <div className="h-3 w-48 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content area — hidden on mobile */}
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <div className="h-16 w-16 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}
