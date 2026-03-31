# Candidate Decisions & Notes

Please use this file to briefly outline your technical choices and the rationale behind them.

## 1. State Management & Architecture
*Why did you structure your state the way you did? Which patterns did you choose for handling the flaky API requests, loading states, and error handling?*

I used a **feature-based architecture** with a custom `useProducts` hook that orchestrates all data-fetching, filtering, pagination, and loading states. The component tree stays focused on rendering while the hook owns the logic.

**Resilience strategy (multi-layered):**
- **Automatic retry with exponential backoff:** Failed API calls retry up to 3 times with increasing delays (1s, 2s, 4s) plus random jitter to prevent thundering herd. This handles the 20% failure rate transparently — most users never see an error.
- **Stale-while-revalidate caching:** An LRU query cache (30s stale time, 5min GC) serves cached data instantly while revalidating in the background. Navigating back to a previously visited page/filter is instantaneous.
- **Stale-while-error:** If a background revalidation fails, the UI keeps showing the last known good data instead of flashing an error.
- **Request cancellation:** Each new fetch invalidates prior in-flight requests via a fetch ID counter, preventing race conditions when the user rapidly changes filters or pages.
- **Debounced search (250ms):** Search input waits until the user pauses before firing a request, reducing unnecessary API calls.
- **Adjacent page prefetching:** After each successful fetch, the next and previous pages are silently prefetched. Pagination hover also triggers prefetch, making page navigation feel instant.

**Distinct loading states:** The hook exposes four granular states (`isLoading`, `isFiltering`, `isPaginating`, `isRevalidating`) so the UI can show the right feedback for each scenario:
- Initial load: full skeleton grid
- Category/search change: skeleton grid matching the previous item count
- Page change: progress bar + skeleton
- Background revalidation: subtle spinner in the status area

**URL-synced state:** All filters (category, search) and pagination are synced to URL query params via `useSearchParams`, so users can bookmark and share specific views.

**Why no external state library?** The state is localized to a single page with no shared consumers. React's built-in hooks (`useState`, `useMemo`, `useCallback`, `useEffect`) are sufficient. Adding Redux, Zustand, or TanStack Query would be over-engineering for this scope, though TanStack Query would be my first choice if the app grew to multiple data-fetching pages.

**Why React Router for URL state?** I chose `react-router`'s `useSearchParams` over the native `URLSearchParams` API because it integrates with React's rendering cycle — URL changes trigger re-renders automatically. With the native API, I'd need manual event listeners and state syncing, which is error-prone and duplicates what React Router gives for free.

**Why Framer Motion over CSS animations?** Framer Motion handles enter/exit animations declaratively with `AnimatePresence`, which CSS alone cannot do (removing DOM nodes mid-animation requires JS coordination). It also provides `LazyMotion` with tree-shakeable feature bundles, keeping the bundle impact minimal (~5KB for the features used). CSS `@keyframes` would work for simple hover effects but not for the staggered grid entrance and toast slide-in/out transitions.

**Glassmorphism design direction:** The boilerplate had a "premium, modern aesthetic" requirement. I chose glassmorphism (translucent backgrounds, backdrop blur, subtle borders) because it creates visual depth without heavy shadows or gradients. All glass values are CSS custom properties (`--glass-bg`, `--glass-card-bg`) for easy theme adjustments.

**Image loading strategy:** Above-fold images (first 4 cards) use `loading="eager"` + `fetchPriority="high"` for fast LCP. Remaining images use `loading="lazy"` + `decoding="async"` to avoid blocking the main thread. The product service also prefetches images for adjacent pages (capped at 48 images with LRU eviction) so pagination feels instant. Product images come from `picsum.photos` — since this external CDN can fail, an `onError` fallback replaces broken images with a placeholder icon.

**Bundle optimization:** Framer Motion is loaded via `LazyMotion` with `domAnimation` features only, which tree-shakes unused animation capabilities. Vite's default code splitting handles route-level chunks automatically.

## 2. Trade-offs and Omissions
*What did you intentionally leave out given the constraints of a take-home assignment? If you had more time, what would you prioritize next?*

**Implemented beyond base requirements:**
- Skeleton loaders that match the grid layout for smooth perceived loading
- URL-synced state for bookmarkable/shareable views
- Stale-while-revalidate + stale-while-error caching
- Image prefetching and LCP optimization (eager loading for above-fold images)
- Comprehensive test suite (76 tests: unit, hook, component)
- Normalized error types with a global error bus for toast notifications
- Framer Motion staggered card animations

**Left out (would prioritize next):**
- **E2E tests with Playwright:** The unit and component tests cover logic and rendering, but browser-level tests would catch integration issues with routing, animations, and real network behavior.
- **Full accessibility audit:** Semantic HTML, ARIA labels, and keyboard navigation are in place, but a screen-reader walkthrough and WCAG 2.1 AA contrast audit would be the next step.
- **Optimistic pagination:** Currently shows a skeleton on page change. Could instead keep the old page visible with a subtle loading indicator for an even smoother feel.
- **Virtual scrolling:** For very large datasets, replacing the grid with a virtualized list (e.g. TanStack Virtual) would reduce DOM nodes.
- **Service Worker caching:** For offline-first resilience beyond the in-memory cache.

## 3. AI Usage
*How did you utilize AI tools (ChatGPT, Copilot, Cursor, etc.) during this assignment? Provide a brief summary of how they assisted you.*

I used **Claude Code (CLI)** to assist with this assignment. Specifically:
- **Scaffolding:** Claude generated the initial component structures (ProductCard, ProductGrid, Pagination, useProducts hook) based on my architectural direction.
- **Bug diagnosis:** Claude identified the skeleton loader not showing on first category change — traced it to `useFetch` treating all post-initial fetches as background revalidations instead of distinguishing param changes.
- **Test suite:** Claude set up Vitest with React Testing Library and wrote tests across all layers (utilities, hooks, components), which I reviewed and refined.
- **Verification:** I reviewed all generated code for correctness, ensuring the retry logic, race-condition handling, cache invalidation, and pagination math were sound.

All architectural decisions (resilience patterns, caching strategy, state structure, component boundaries, loading state granularity) were my own choices. Claude was used as an implementation accelerator, not a decision-maker.

## 4. Edge Cases Identified
*Did you notice any edge cases or bugs that you didn't have time to fix? Please list them here.*

**Found and fixed:**
- **Skeleton not showing on first category change:** `useFetch` was setting `isRevalidating` instead of `isFetching` when params changed after initial load, because it only checked `dataRef.current !== null`. Fixed by tracking whether params actually changed via a ref comparison.

**Known but not fixed (mock API quirks):**
- **Mock data randomness:** `mockProducts` uses `Math.random()` at module load, so prices/categories/stock change on every page refresh. In a real app this wouldn't happen since data comes from a persistent database.
- **Category count mismatch:** Because mock data is random, filtering by "Electronics" may return different counts each session. The UI handles this correctly (pagination adjusts, empty state shows when appropriate).
- **Rapid filter + retry overlap:** The fetch ID counter prevents stale responses from rendering, but previously initiated retries from an old request may still be in-flight until they complete or timeout. They are silently discarded, so there's no user-facing impact — just wasted network calls.
- **Image CDN failures:** Product images from picsum.photos could fail. An `onError` fallback swaps to the favicon, but a proper placeholder image would be better UX.
