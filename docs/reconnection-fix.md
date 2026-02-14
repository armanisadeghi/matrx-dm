# Reconnection Stack Overflow Fix

## Problem

The initial implementation of the reconnection logic caused a **stack overflow error** due to infinite recursion:

```
RangeError: Maximum call stack size exceeded
at setupChannel (lib/hooks/useRealtimeMessages.ts:248:23)
```

### Root Cause

When a Supabase Realtime channel received a "CLOSED" status, the code immediately called `setupChannel()` again from within the subscribe callback. This created a recursive loop:

1. Channel closes → subscribe callback fires with "CLOSED"
2. Callback calls `setupChannel()`
3. `setupChannel()` removes old channel and creates new one
4. New channel immediately closes (during cleanup) → callback fires again
5. Loop continues infinitely, exhausting the call stack

The `await supabase.removeChannel()` call was particularly problematic because it was awaited inside an async function that was being called recursively.

## Solution

Implemented multiple safeguards to prevent recursion and ensure clean reconnection:

### 1. **Reconnection Guard Flag**
```typescript
const isReconnectingRef = useRef(false);
```

Prevents concurrent reconnection attempts. If a reconnection is already in progress, subsequent calls return immediately.

### 2. **Cleanup Flag**
```typescript
let isCleanedUp = false;
```

Tracks whether the effect has been cleaned up (component unmounted or conversationId changed). All async operations check this flag before proceeding.

### 3. **Deferred Reconnection**
Instead of calling `setupChannel()` directly from the subscribe callback, we schedule it with `setTimeout()`:

```typescript
setTimeout(() => {
  if (!isCleanedUp) {
    setupChannel();
  }
}, 1000);
```

This breaks out of the current call stack, preventing recursion.

### 4. **Early Returns on Cleanup**
All async callbacks check `isCleanedUp` before dispatching actions:

```typescript
if (isCleanedUp) return;
```

This prevents state updates after component unmount.

### 5. **Safe Channel Removal**
Wrapped channel removal in try-catch to handle any errors gracefully:

```typescript
try {
  await supabase.removeChannel(channelRef.current);
} catch (err) {
  console.error("[useRealtimeMessages] Error removing channel:", err);
}
```

### 6. **Proper Cleanup**
The effect cleanup function now:
- Sets `isCleanedUp = true` to stop all pending operations
- Resets `isReconnectingRef.current = false`
- Clears all timeouts
- Removes the channel
- Nullifies all refs

## Testing Verification

After the fix, the following scenarios should work without errors:

1. ✅ Opening a conversation - no stack overflow
2. ✅ Switching between conversations - clean channel cleanup
3. ✅ Network disconnection - proper reconnection attempts
4. ✅ Component unmount - no memory leaks or pending callbacks
5. ✅ Rapid conversation switching - no race conditions

## Key Takeaways

**Never call async setup functions recursively from their own callbacks.** Always use:
- `setTimeout()` to break out of the call stack
- Guard flags to prevent concurrent execution
- Cleanup flags to prevent operations after unmount
- Try-catch around async cleanup operations

## Files Modified

- `lib/hooks/useRealtimeMessages.ts` - Fixed recursion, added guards and proper cleanup
