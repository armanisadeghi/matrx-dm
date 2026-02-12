export default function ConversationLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        <div className="h-10 w-10 rounded-full animate-shimmer" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-32 rounded animate-shimmer" />
          <div className="h-3 w-20 rounded animate-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full animate-shimmer" />
          <div className="h-8 w-8 rounded-full animate-shimmer" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Received message */}
        <div className="flex items-end gap-2">
          <div className="h-8 w-8 rounded-full animate-shimmer" />
          <div className="flex flex-col gap-1">
            <div className="h-3 w-16 rounded animate-shimmer" />
            <div className="h-10 w-48 rounded-2xl animate-shimmer" />
          </div>
        </div>

        {/* Sent message */}
        <div className="flex items-end gap-2 self-end">
          <div className="h-10 w-56 rounded-2xl animate-shimmer" />
        </div>

        {/* Received message */}
        <div className="flex items-end gap-2">
          <div className="h-8 w-8 rounded-full animate-shimmer" />
          <div className="flex flex-col gap-1">
            <div className="h-3 w-20 rounded animate-shimmer" />
            <div className="h-16 w-64 rounded-2xl animate-shimmer" />
          </div>
        </div>

        {/* Sent message */}
        <div className="flex items-end gap-2 self-end">
          <div className="h-8 w-40 rounded-2xl animate-shimmer" />
        </div>

        {/* Received message */}
        <div className="flex items-end gap-2">
          <div className="w-8 shrink-0" />
          <div className="h-10 w-52 rounded-2xl animate-shimmer" />
        </div>

        {/* Sent message */}
        <div className="flex items-end gap-2 self-end">
          <div className="h-14 w-60 rounded-2xl animate-shimmer" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border-subtle px-4 py-3">
        <div className="h-9 w-full rounded-2xl animate-shimmer" />
      </div>
    </div>
  );
}
