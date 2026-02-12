"use client";

import { cn } from "@/lib/cn";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Pin, BellOff, Trash2 } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import type { ConversationWithDetails } from "@/lib/types";

type SwipeableConversationItemProps = {
  conversation: ConversationWithDetails;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPin?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
};

const SWIPE_THRESHOLD = 80;

export function SwipeableConversationItem({
  conversation,
  isActive,
  onClick,
  onContextMenu,
  onPin,
  onMute,
  onDelete,
}: SwipeableConversationItemProps) {
  const x = useMotionValue(0);

  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1]);

  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.5]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right swipe background — Pin */}
      <motion.div
        className="absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-accent"
        style={{ opacity: rightOpacity }}
      >
        <motion.div style={{ scale: rightScale }}>
          <Pin size={20} className="text-white" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Left swipe background — Delete / Mute */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center gap-0"
        style={{ opacity: leftOpacity }}
      >
        <div className="flex h-full w-20 items-center justify-center bg-text-tertiary">
          <motion.div style={{ scale: leftScale }}>
            <BellOff size={20} className="text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
        <div className="flex h-full w-20 items-center justify-center bg-destructive">
          <motion.div style={{ scale: leftScale }}>
            <Trash2 size={20} className="text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: SWIPE_THRESHOLD }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) {
            onPin?.();
          } else if (info.offset.x < -120) {
            onDelete?.();
          } else if (info.offset.x < -SWIPE_THRESHOLD) {
            onMute?.();
          }
        }}
        className="relative bg-bg-primary"
      >
        <ConversationListItem
          conversation={conversation}
          isActive={isActive}
          onClick={onClick}
          onContextMenu={onContextMenu}
        />
      </motion.div>
    </div>
  );
}
