  
AI MATRX

**Universal Messaging Platform**

UI/UX Design & Development Standards

*Every pixel has a purpose. Every interaction tells a story. Every component earns its place. This is not a messaging app — it is the standard by which all others will be measured.*

Version 1.0

February 2026

CONFIDENTIAL

# **Contents**

*Note: Update this table of contents in Word after opening by right-clicking and selecting “Update Field.”*

# **The Standard We Are Setting**

We are not building another messaging app. The world has plenty of those. We are building the messaging platform — the one that makes people stop and say, “This is how it should have always felt.”

Think about the first time you used iMessage on a Mac. The way conversations flowed. The way the sidebar knew when to appear and when to disappear. The way controls floated above content instead of crowding it. The way every animation had weight and intention. That feeling — that sense of effortless intelligence — is our North Star.

But we are not copying Apple. We are studying what makes their work transcendent and applying those same principles at an even higher level with technologies they do not have. We have the full power of modern web: React Server Components, Supabase Realtime, Tailwind’s constraint-based design system, and the incredible performance ceiling of Next.js 16. We have the tools to build something that rivals native. The question is whether we have the discipline.

This document exists to ensure we do.

# **Design Philosophy**

*Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupéry*

## **The Five Commandments**

**1. Every Element Earns Its Place.** If a pixel, a border, a shadow, or a line of code does not serve a clear, articulated purpose, it does not exist. We do not add things because they “look nice.” We add things because they solve a problem, clarify information, or guide the user’s eye. Before you add any visual element, ask yourself: what happens if I remove this? If the answer is “nothing changes,” then remove it.

**2. Content Is King, Chrome Is Invisible.** The UI exists to present messages, conversations, and connections. It should never compete with the content for attention. Navigation, controls, metadata — these are supporting actors. They appear when needed, disappear when not, and never steal the scene. Look at the reference designs: notice how controls float without heavy backgrounds. Notice how the sidebar is generous with space. Notice how the conversation thread breathes. That is what invisible chrome looks like.

**3. Motion With Meaning.** Every animation serves one of three purposes: it orients the user in space (where did I come from, where am I going), it provides feedback (yes, that action worked), or it creates delight (a subtle spring that makes an interaction feel alive). If an animation does not serve one of these three purposes, it is decoration, and decoration is noise. Our animations should feel like gravity — natural, expected, and satisfying.

**4. Consistency Is Kindness.** Every time a user encounters an inconsistency — a button that is 2px taller here, a different shade of gray there, a transition that is 200ms in one place and 300ms in another — their brain spends micro-cycles processing the difference. Those micro-cycles accumulate into cognitive fatigue. Consistency is not boring. Consistency is respect for the user’s mental energy. It is kindness, expressed through code.

**5. Less, But Better.** Dieter Rams said this decades ago and it has never been more relevant. We will build fewer components, but each one will be extraordinary. We will support fewer features at launch, but each one will be flawless. We will write less code, but every line will be intentional. The temptation to add is constant. The discipline to subtract is what separates good products from great ones.

# **Visual Language**

Our visual language is inspired by Apple’s Human Interface Guidelines but adapted for the web and enhanced by modern capabilities. It prioritizes clarity, depth, and deference.

## **Color System**

Color is not decoration. It is information architecture. Every color in our palette has a specific semantic role, and that role does not change based on context or developer preference. We maintain a single source of truth for all color values.

| Single Source of Truth All color tokens live in one file: tailwind.config.ts (extended theme). Every component references these tokens exclusively. No hardcoded hex values. No rgb() calls. No opacity hacks. If a color does not exist in the token system, it does not belong in the product. |
| :---- |

**Semantic Color Tokens.** We define colors by function, not by appearance. Use names like bg-primary, text-secondary, border-subtle, accent-action — never blue-500 or gray-200 in component code. The mapping between semantic tokens and actual color values changes between light and dark mode, but the component code never knows or cares.

**Dark Mode Is Not an Afterthought.** Dark mode is the default development mode. We design in dark first because it is harder to get right and reveals contrast problems faster. Every color token has both a light and dark value defined from day one. We use the CSS prefers-color-scheme media query via Tailwind’s dark: variant, respecting the user’s system preference with an optional manual override stored in localStorage.

**Depth Through Luminance.** In dark mode, we create hierarchy through subtle luminance shifts rather than shadows. Background layers step from near-black (like #000000 or #1C1C1E) to progressively lighter surfaces (#2C2C2E, #3A3A3C). Each layer tells the user how “close” a surface is to them. In light mode, we achieve the same hierarchy through shadows and very subtle gray shifts on white. The conversation list background is slightly different from the message thread background, which is slightly different from an input field background. These differences are barely perceptible individually but create a rich sense of spatial depth collectively.

## **Typography**

Typography is not about picking a font. It is about creating a system where every piece of text communicates its role through size, weight, and spacing alone, without requiring color or decoration to differentiate it.

| The Type Scale We use a constrained type scale with exactly 7 sizes. No more, no exceptions. Each size maps to a specific semantic role: XS (10px) for timestamps and metadata, SM (12px) for captions and secondary labels, BASE (14px) for body text and messages, MD (16px) for conversation names and section headers, LG (18px) for page-level titles, XL (22px) for onboarding and empty states, 2XL (28px) for the app name and major headings. Everything is defined in the Tailwind config. Developers use text-xs through text-2xl and never set font-size manually. |
| :---- |

**Font Family.** We use the system font stack as our primary typeface: -apple-system, BlinkMacSystemFont, ‘SF Pro’, ‘Segoe UI’, Roboto, ‘Helvetica Neue’, sans-serif. This gives us native rendering on every platform, eliminates font loading overhead, and ensures text feels “of the device” rather than “of the web.” We pair this with SF Mono / Menlo / Consolas for any code or monospace content.

**Weight as Hierarchy.** We use exactly three weights: Regular (400) for body text, Medium (500) for emphasis and labels, and Semibold (600) for headings and names. Bold (700) is reserved exclusively for unread message counts and critical indicators. No other weight values are permitted. When you feel the urge to make something bold, first ask if you can solve the problem with size or color instead.

**Line Height and Letter Spacing.** Message body text uses a line-height of 1.5 for comfortable reading. UI labels and navigation use 1.25 for tighter, more controlled layouts. All-caps labels (used sparingly) get letter-spacing of 0.05em for legibility. These values are configured in Tailwind’s theme and referenced as leading-relaxed, leading-snug, and tracking-wide.

## **Spacing & Layout**

Spacing is the single most underappreciated aspect of interface design. Inconsistent spacing is the fastest way to make a polished design feel cheap. We use a strict 4px base grid and Tailwind’s spacing scale exclusively.

| The 4px Grid Every margin, padding, gap, and dimensional value in the system is a multiple of 4px. Tailwind’s default spacing scale (0.5 = 2px, 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 5 = 20px, 6 = 24px, 8 = 32px, 10 = 40px, 12 = 48px) is our vocabulary. If you find yourself reaching for arbitrary values like p-[13px] or mt-[7px], stop. Something in your layout is wrong. Fix the structure, not the symptom. |
| :---- |

**Breathing Room.** Content needs space to breathe. Message bubbles need comfortable internal padding (12px horizontal, 8px vertical as a starting point). Conversation list items need vertical padding that makes each one easily tappable (minimum 44px touch target on mobile, per Apple’s HIG). The sidebar needs generous horizontal padding so text never feels cramped against edges. When in doubt, add more space, not less.

**The Sidebar.** On desktop (1024px+), the sidebar is a fixed-width panel (320px recommended, configurable) that sits beside the main conversation view. At the tablet breakpoint (768px–1023px), the sidebar overlays the conversation as a sheet. On mobile (<768px), it becomes the full-screen view, and tapping a conversation transitions to the full-screen message thread with a back gesture/button. The transition between these states must feel seamless — no jarring layout shifts, no content reflow, no flash of unstyled content.

## **Iconography & Controls**

Our icons and controls follow one rule above all others: they float. They do not sit inside thick containers, heavy toolbars, or opaque backgrounds. They exist directly on the content surface, appearing as natural extensions of the interface rather than separate UI layers.

**Floating Controls.** Look at the reference screenshots. The compose button, the video call icon, the emoji picker trigger, the attachment menu — none of them sit inside a visible toolbar or header bar. They are positioned with absolute or fixed positioning, using subtle backdrop-blur and micro-shadows only when they overlap scrollable content. The visual weight of a control should be proportional to how often it is used. A primary action (send message) gets more visual weight than a secondary action (attach file), which gets more than a tertiary action (message effects).

**Icon System.** We use a single icon library (Lucide React recommended for its consistency and tree-shaking). Every icon is rendered at one of three sizes: 16px for inline/metadata, 20px for standard controls, 24px for primary actions. Icons are always rendered in the current text color or a semantic color token — never a hardcoded color. Stroke width is 1.5px universally for the refined, Apple-like aesthetic.

**Touch Targets.** Every interactive element has a minimum touch target of 44×44px on mobile, regardless of its visual size. A 20px icon button still has a 44px tap area achieved through padding. This is non-negotiable. If a design makes it impossible to achieve 44px touch targets without visual crowding, the design needs fewer elements, not smaller targets.

# **Component Architecture**

*The best component is the one you never had to build because an existing one already solved the problem beautifully.*

## **The Component Philosophy**

We build fewer components, not more. Every component in our library is a commitment — a commitment to maintain, document, test, and keep consistent across the entire application. Before creating a new component, you must be able to answer “yes” to all three questions: Is this pattern used in three or more places? Does no existing component serve this purpose? Will this component remain stable for at least 6 months?

If you cannot answer yes to all three, you do not need a new component. You need a variant of an existing one, or you need a one-off composition of primitives. The goal is a component library of approximately 25–35 components that cover 100% of the application’s needs. Not 100 components that each serve a single purpose.

## **Core Component Inventory**

The following is the exhaustive list of shared components for the messaging platform. Each one is designed to be maximally reusable and minimally opinionated about layout.

**Foundation Layer**

* Avatar — Renders user photos with fallback initials, online status indicator, and configurable size (xs/sm/md/lg). Uses a single bg-gradient for the initials fallback with the user’s assigned color. Handles image loading gracefully with a shimmer placeholder.

* Icon Button — Wraps any icon with consistent touch targets, hover/press states, and optional tooltip. Supports ghost (transparent), subtle (light bg on hover), and solid variants.

* Badge — Small count indicator for unread messages. Renders as a red dot for counts > 99, a number for 1–99, and is invisible for 0. Animates in with a spring scale.

* Divider — A thin line with configurable orientation and spacing. Uses border-subtle color. Should be used sparingly — whitespace is usually better.

* Spinner — A lightweight loading indicator matching our design language. Uses a custom SVG, not a generic library spinner.

**Messaging Layer**

* MessageBubble — Renders a single message with text, media, reactions, and delivery status. Handles sent vs. received styling, consecutive message grouping (removes avatar/name for sequential messages from the same sender), and long-press/right-click context menu trigger.

* MessageInput — The composition area. Auto-growing textarea with send button, attachment trigger, and emoji picker trigger. Handles keyboard shortcuts (Enter to send, Shift+Enter for newline). Must feel instant — zero perceived latency between keypress and character appearance.

* ConversationListItem — A single row in the sidebar. Shows avatar, name, preview text, timestamp, unread badge, and muted/pinned indicators. Supports swipe actions on mobile (pin, mute, delete) and right-click context menu on desktop.

* MessageThread — The scrollable container for messages. Handles virtualized rendering for performance, scroll-to-bottom behavior, “new messages” indicator, and date separators between message groups.

* ConversationHeader — Shows the active conversation’s name, avatar, status, and action buttons (call, video, info). Floats above the message thread with backdrop-blur on scroll.

**Overlay Layer**

* ContextMenu — A floating menu triggered by right-click or long-press. Renders above all content with a subtle shadow and backdrop-blur. Supports sections, icons, destructive actions (red text), and keyboard navigation.

* EmojiPicker — A searchable, categorized emoji grid. Renders as a popover anchored to the trigger. Supports recent emojis, skin tone selection, and keyboard navigation. Must load lazily and not block initial page render.

* MediaViewer — Full-screen overlay for viewing images and videos. Supports pinch-to-zoom, swipe to dismiss, and gallery navigation.

* Sheet — A slide-up panel for mobile interactions (new message, conversation details, settings). Uses spring physics for the drag-to-dismiss gesture.

* Toast — Ephemeral notification for success/error states. Appears from top or bottom, auto-dismisses, and stacks gracefully.

**Navigation Layer**

* Sidebar — The conversation list container. Handles search, filtering (All, Unread, Groups, Contacts), and the responsive collapse behavior described in the Layout section. On mobile this is the primary view; on desktop it’s a persistent panel.

* TabBar — Bottom navigation for mobile (Chats, Calls, Contacts, Settings). Uses custom-animated indicator and haptic feedback on selection.

* SearchBar — An expandable search input that filters conversations and messages. On mobile, it expands from a compact icon to full-width with a smooth animation.

## **Component API Standards**

Every shared component must follow these conventions without exception:

* TypeScript interfaces for all props, exported from the component file. No ‘any’ types. No optional props without defaults.

* Tailwind-only styling via className composition. The cn() utility (clsx + tailwind-merge) is the only acceptable way to merge conditional classes.

* Forwarded refs on all interactive elements using React.forwardRef or the ref prop pattern in React 19.

* Accessible by default: correct ARIA roles, keyboard navigation, focus management, and screen reader announcements are built into the component, not added by consumers.

* Variant-driven API: components expose a variant prop (e.g., ghost, subtle, solid) rather than accepting arbitrary className overrides for core styling.

* Size-constrained: components accept a size prop from a fixed set (xs, sm, md, lg) rather than arbitrary width/height values.

* Zero side effects: components do not fetch data, subscribe to stores, or cause navigation. They receive data and emit events. Period.

| The className Escape Hatch Components may accept a className prop for layout-related overrides only (margin, position, width constraints). This prop is merged last in the cn() chain so it can override layout but not core styling. If a consumer needs to change a component’s core visual appearance, that is a signal that we need a new variant, not a className hack. |
| :---- |

# **Technical Architecture**

## **Next.js 16.1 App Router**

We leverage the App Router’s full capability: Server Components by default, Client Components only when interactivity demands it, and Partial Prerendering for the fastest possible initial load.

**Server Components First.** The conversation list, message history (initial load), user profiles, and settings pages are Server Components. They fetch data on the server, render HTML, and stream it to the client. No JavaScript bundle for these routes. The client only hydrates the interactive islands: the message input, real-time message updates, emoji picker, and drag/swipe gestures.

**Route Structure.** The app uses a clean nested route structure: /messages for the conversation list (sidebar), /messages/[conversationId] for individual conversation threads, /messages/[conversationId]/info for conversation details, /calls for the calls tab, /contacts for the contacts tab, and /settings for user settings. Each route segment maps to a layout.tsx that provides the appropriate shell (sidebar + content, full-screen, etc.).

**Loading States.** Every route has a loading.tsx that renders a skeleton matching the final layout. Skeletons use the shimmer animation (a subtle left-to-right gradient sweep) and match the exact dimensions of real content. Users should never see a blank screen or a generic spinner. The skeleton should be so accurate that the transition from skeleton to real content is barely noticeable.

## **Supabase Realtime Integration**

Real-time messaging is the heartbeat of this application. Messages must appear instantly for both sender and recipient, typing indicators must feel live, and presence (online/offline/last seen) must update without polling.

**Channel Architecture.** Each conversation subscribes to a Supabase Realtime channel scoped to that conversation’s ID. We use Postgres Changes for message inserts/updates/deletes (reliable, ordered, persistent) and Broadcast for ephemeral events (typing indicators, read receipts, presence). This separation ensures that critical data (messages) flows through the durable Postgres path while lightweight signals use the faster broadcast path.

**Optimistic Updates.** When a user sends a message, it appears in their thread immediately with a “sending” state (subtle opacity change or clock icon). The message is sent to Supabase, and when the Postgres Change event returns, we reconcile the optimistic message with the confirmed one. If the send fails, the message shows an error state with a retry button. The user should never wait for a network round-trip to see their own message.

**Connection Resilience.** The Realtime connection must handle network interruptions gracefully. On disconnect, we show a subtle banner (“Reconnecting...”) after 3 seconds. On reconnect, we fetch any missed messages since the last received timestamp and merge them into the thread. The user should never lose messages due to a brief connectivity gap.

## **Tailwind CSS 4.1 — The Only Styling System**

| Zero Tolerance Policy No inline styles. No CSS modules. No styled-components. No emotion. No CSS-in-JS of any kind. No style={{ }} props. Tailwind utility classes are the only permitted way to style components. This is not a suggestion. This is a hard technical constraint enforced by linting rules that will block merges. |
| :---- |

**Theme Configuration.** All design tokens (colors, spacing, typography, shadows, border-radius, transitions) are defined in tailwind.config.ts. This file is the single source of design truth. Changing a color here changes it everywhere. Adding a new spacing value here makes it available everywhere. Nothing exists outside this system.

**Custom Utilities.** For patterns that Tailwind’s defaults do not cover, we use Tailwind’s plugin system to create custom utilities. Examples include: glass (backdrop-blur + semi-transparent bg for floating controls), scrollbar-hide (hides scrollbar on conversation lists), safe-bottom (padding-bottom for iOS safe areas), and animate-spring (our custom spring animation curves).

**Responsive Design.** We use Tailwind’s responsive prefixes (sm:, md:, lg:, xl:) exclusively. Our breakpoints are: sm (640px) for large phones in landscape, md (768px) for tablets — this is where the sidebar collapses, lg (1024px) for small desktops — sidebar becomes persistent, xl (1280px) for larger desktops where we may widen the sidebar or add a third panel. Mobile-first: we write base styles for mobile, then add responsive modifiers for larger screens.

## **State Management**

State management in this application is deliberately simple. We use React’s built-in primitives for the vast majority of state, and we reach for external tools only when React’s model genuinely falls short.

* Server State: React Server Components + Supabase queries. No client-side caching library needed for initial data.

* Real-time State: Supabase Realtime channels + React state (useState/useReducer) within a context provider scoped to the active conversation.

* UI State: useState for component-local concerns (is this dropdown open, what is the current input value). useContext for cross-component concerns (active theme, sidebar open/closed state).

* URL State: Next.js router for conversation selection, active tab, and search queries. The URL is always the source of truth for navigation state.

* Persistent Preferences: A lightweight store (Zustand if needed, otherwise just localStorage with a typed wrapper) for user preferences like theme, notification settings, and sidebar width.

| What We Do Not Use No Redux. No MobX. No Jotai. No Recoil. Not because these are bad tools, but because our state topology does not require them. Server Components eliminate the need for client-side data fetching libraries. Supabase Realtime eliminates the need for complex synchronization logic. React 19’s improved context performance eliminates the need for third-party state selectors. Simplicity is a feature. |
| :---- |

# **Interaction Design**

## **Gestures & Touch**

On mobile, gestures are the primary interaction model. They must feel physically grounded — objects should move with your finger, resist at boundaries, and snap to resting positions with natural spring physics.

* Swipe-to-reveal on conversation list items: swipe left reveals delete (red) and mute (gray). Swipe right reveals pin (blue). The actions scale in from 0 opacity/size as the swipe progresses, with a threshold at 40% where the primary action “snaps” into committed state.

* Pull-to-refresh on the conversation list: a subtle indicator appears above the list. Uses overscroll to feel native. The refresh indicator is our custom spinner, not the browser default.

* Swipe-to-reply on individual messages: swipe right on a message to quote-reply it. The message slides slightly and a reply icon appears. Release to commit. This is a common pattern in Telegram and WhatsApp that users now expect.

* Long-press for context menu on messages: after 500ms of press, the message lifts with a subtle scale-up and shadow, and the context menu appears with a spring animation. The background dims slightly to focus attention on the menu.

## **Keyboard & Desktop Interactions**

Desktop users expect keyboard-driven efficiency. Our keyboard shortcuts should make power users feel like they are flying through conversations.

* Up/Down arrows in the sidebar to navigate conversations, Enter to open.

* Cmd/Ctrl+K to open the search spotlight, which searches across conversations, contacts, and message content.

* Cmd/Ctrl+N to start a new conversation.

* Escape to close any overlay, popover, or return to the conversation list.

* Tab to move focus between major UI regions (sidebar, message thread, input).

* Right-click on conversations and messages for the context menu, matching the patterns shown in the reference screenshots (Pin, Mark as Unread, Hide Alerts, Open in New Window, Delete).

## **Transitions & Animations**

We use a small, consistent set of animation primitives. Every animation in the app is a composition of these primitives.

| The Animation Token System Duration tokens: fast (120ms) for micro-interactions like button presses, normal (200ms) for transitions like popover open/close, slow (350ms) for page-level transitions like sidebar collapse. Easing tokens: ease-out (default for entrances), ease-in (for exits), spring (custom cubic-bezier or framer-motion spring for physical gestures). These tokens are defined as Tailwind utilities (duration-fast, duration-normal, ease-spring) and used consistently everywhere. |
| :---- |

**Message Appearance.** New messages animate in from the bottom of the thread with a subtle translateY(8px) → translateY(0) and opacity(0) → opacity(1) over 200ms with ease-out. Sent messages animate from the right; received messages from the left. This directional animation reinforces who sent each message.

**Sidebar Collapse.** When the viewport crosses the md breakpoint, the sidebar transitions from persistent panel to overlay sheet over 350ms with a spring easing. The main content does not shift — the sidebar slides over it with a semi-transparent backdrop. This ensures no content reflow occurs, which is one of the most jarring UX patterns in responsive design.

**Context Menus.** Context menus appear with scale(0.95) → scale(1) and opacity(0) → opacity(1) over 150ms, anchored to the trigger point. They use backdrop-blur for that iOS-native translucent glass effect. On dismiss, they reverse the animation over 100ms.

# **Performance Standards**

Performance is a design feature. A beautiful interface that takes 3 seconds to load or stutters during scroll has failed, no matter how elegant it looks. We hold ourselves to the following measurable targets:

* First Contentful Paint (FCP): under 1.0 second on 4G connections.

* Largest Contentful Paint (LCP): under 1.5 seconds.

* Time to Interactive (TTI): under 2.0 seconds.

* Cumulative Layout Shift (CLS): under 0.05.

* Interaction to Next Paint (INP): under 100ms.

* Message send latency (perceived): under 50ms (optimistic update).

* Scroll performance: 60fps with no dropped frames, even with 10,000+ messages in a thread (virtualized rendering).

**Bundle Size Budget.** The initial JavaScript bundle for the messaging interface must not exceed 120KB gzipped. The emoji picker, media viewer, and other heavy components are loaded lazily. Every dependency addition must be justified with a size-impact analysis. If a library adds more than 10KB gzipped and a leaner alternative exists, we use the alternative.

**Image Optimization.** All user-uploaded images are processed through Next.js Image Optimization or a CDN pipeline. Thumbnails are generated at multiple resolutions (120px, 240px, 480px) and served based on viewport size. Profile avatars use 80px thumbs in the sidebar, 120px in conversation headers, and full resolution only in the profile viewer. Images use blur-up placeholders generated at upload time.

# **Accessibility as a Core Feature**

Accessibility is not a checklist to satisfy auditors. It is a design principle that makes the product better for everyone. A well-structured accessible interface is faster to navigate with a keyboard, easier to automate with testing tools, and more resilient to edge cases.

* Semantic HTML: Every component uses the correct HTML element. Buttons are <button>, links are <a>, lists are <ul>/<li>, navigation is <nav>. No div-based buttons. No span-based links.

* ARIA where needed: Interactive custom components (emoji picker, context menu, conversation list) use appropriate ARIA roles (menu, menuitem, listbox, option, dialog) and states (aria-expanded, aria-selected, aria-live).

* Focus management: Opening a dialog traps focus inside it. Closing it returns focus to the trigger. Navigating to a conversation moves focus to the message input. Focus rings are visible and styled (ring-2 ring-blue-500 ring-offset-2) — never hidden globally.

* Screen reader support: Messages are announced as they arrive (aria-live=“polite” on the message thread). Conversation names, timestamps, and read receipts have appropriate aria-labels. Images require alt text.

* Reduced motion: All animations respect prefers-reduced-motion. When reduced motion is preferred, animations are replaced with instant state changes. This is handled globally through a Tailwind variant (motion-safe: and motion-reduce:).

* Color contrast: All text meets WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text) in both light and dark modes. This is verified during design review and enforced by automated tests.

# **Code Quality & Development Workflow**

## **The Code Review Checklist**

Every pull request is reviewed against these criteria. A single violation in any category blocks the merge.

**Visual Consistency:** Does every spacing value come from the Tailwind scale? Does every color reference a semantic token? Does every text element use a type scale size? Does every interactive element have a 44px minimum touch target? Are animations using the defined timing tokens?

**Component Integrity:** Is this logic reusing an existing component or justified as a new one? Are props typed with TypeScript interfaces? Is className only used for layout overrides? Are all interactive elements keyboard-accessible? Does the component forward refs?

**Performance:** Are heavy components lazily loaded? Are images optimized and responsively sized? Is the component a Server Component where possible? Are there unnecessary re-renders (check with React DevTools)? Does the bundle-size delta stay within budget?

**Tailwind Purity:** Zero inline styles? Zero CSS modules? Zero style props? All styling done with Tailwind utilities? Custom values only through the theme config, never arbitrary bracket notation for recurring values?

## **File & Naming Conventions**

* Components: PascalCase (MessageBubble.tsx, ConversationListItem.tsx). One component per file. Co-located with its types, variants, and story file.

* Hooks: camelCase with “use” prefix (useConversation.ts, useRealtimeMessages.ts). One hook per file.

* Utilities: camelCase (formatTimestamp.ts, cn.ts). Pure functions only.

* Routes: kebab-case directory names following Next.js conventions (/messages/[conversationId]/page.tsx).

* Constants: SCREAMING_SNAKE_CASE for values, PascalCase for type-like objects (ANIMATION_DURATION, MessageStatus).

## **Testing Standards**

* Every shared component has a visual regression test using Playwright’s screenshot comparison. If a component’s rendered output changes by even 1 pixel, the test fails and requires explicit approval.

* Every interaction (button click, swipe, keyboard shortcut) has an integration test that verifies the expected state change.

* Realtime features have dedicated tests using Supabase’s test helpers to simulate message delivery, typing indicators, and connection drops.

* Accessibility is tested automatically with axe-core in every component test. Any violation fails the test.

* Performance budgets are enforced in CI. If a PR increases the main bundle by more than 5KB, it is flagged for review.

# **The Bar We’re Setting**

Read this section when you are tired. Read it when you are tempted to cut corners. Read it when a deadline feels impossible and “good enough” feels within reach.

Good enough is the enemy of what we are building.

We are building a messaging platform that will make people feel something. Not just functionality — people have had that since SMS. Not just beauty — people have had that since iMessage. We are building the combination: the product where every single interaction, from opening the app to sending a message to switching a conversation, feels like it was crafted by people who care deeply about the human being on the other side of the screen.

That level of care shows up in the details. It shows up in the 4px of padding you agonized over. In the 50ms of spring tension you fine-tuned. In the color token you created because none of the existing ones were quite right. In the component you refactored three times until the API felt inevitable instead of designed.

That is the standard. Not because our users will consciously notice these details. But because they will feel them. They will open our app and it will feel right in a way they cannot articulate. And that feeling — that subconscious sense of quality, of care, of intention — is what will make them stay.

*We are not building a messaging app. We are building the messaging app. And every single one of you is here because you have the talent and the taste to make that real. Now let’s ship it.*

— End of Standards Document —