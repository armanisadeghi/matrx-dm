import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-secondary">
          <MessageSquare size={28} strokeWidth={1.5} className="text-text-tertiary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-text-primary">
            Matrx DM
          </h2>
          <p className="text-sm text-text-secondary">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    </div>
  );
}
