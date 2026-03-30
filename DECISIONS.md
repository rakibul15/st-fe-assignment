# Candidate Decisions & Notes

Please use this file to briefly outline your technical choices and the rationale behind them.

## 1. State Management & Architecture
*Why did you structure your state the way you did? Which patterns did you choose for handling the flaky API requests, loading states, and error handling?*

I used a custom hook (`useProducts`) to encapsulate all data-fetching logic, keeping the component tree clean and focused on rendering.

**Resilience strategy:**
- **Automatic retry with exponential backoff:** Failed API calls are retried up to 3 times with increasing delays (1s, 2s, 4s). This handles the 20% failure rate transparently — most users never see an error.
- **Abort tracking via ref counter:** Each new fetch increments a counter. Stale responses from previous requests are discarded, preventing race conditions when the user rapidly changes filters/pages.
- **Debounced search (400ms):** Typing in the search box does not fire a request on every keystroke — it waits until the user pauses, reducing unnecessary API calls.
- **Explicit loading/error/empty states:** The UI always communicates what is happening. Errors show a manual retry button as a final fallback.

**Why no external state library?** The state is localized to a single page with no shared consumers. React's built-in `useState` + `useEffect` + `useCallback` are sufficient. Adding Redux or Zustand would be over-engineering for this scope.

## 2. Trade-offs and Omissions
*What did you intentionally leave out given the constraints of a take-home assignment? If you had more time, what would you prioritize next?*

- **Skeleton loading:** Currently showing a spinner. With more time, I'd add skeleton cards that match the grid layout for a smoother perceived loading experience.
- **URL-synced state:** Filters, search, and page number could be persisted in URL query params so that users can share/bookmark a specific view.
- **Optimistic UI / stale-while-revalidate:** Show the previous page's data while fetching new data to avoid the loading flash on page changes.
- **Accessibility audit:** I added aria-labels and semantic HTML, but a full screen-reader audit and keyboard navigation test would be the next step.
- **Unit/integration tests:** Would add tests for the retry logic, pagination edge cases, and component rendering with React Testing Library.
- **Image error handling:** Product images from picsum.photos could fail; adding an `onError` fallback would improve robustness.

## 3. AI Usage
*How did you utilize AI tools (ChatGPT, Copilot, Cursor, etc.) during this assignment? Provide a brief summary of how they assisted you.*

I used **Claude Code (CLI)** to assist with this assignment. Specifically:
- **Scaffolding:** Claude generated the initial component structures (ProductCard, Pagination, useProducts hook) based on my architectural direction.
- **Verification:** I reviewed all generated code for correctness, ensuring the retry logic, race-condition handling, and pagination math were sound.
- **Iteration:** I guided Claude through requirements (resilience patterns, Tailwind styling, accessibility attributes) and refined the output.

All architectural decisions (retry strategy, debounce approach, state structure, component boundaries) were my own choices.

## 4. Edge Cases Identified
*Did you notice any edge cases or bugs that you didn't have time to fix? Please list them here.*

- **Mock data randomness:** `mockProducts` uses `Math.random()` at module load, so prices/categories change on every page refresh. In a real app this wouldn't happen since data comes from a database.
- **Search + pagination interaction:** Searching resets to page 1, which is correct. However, if a user is on page 5 and the search narrows results to 2 pages, the reset prevents a blank page — this is handled.
- **Rapid filter changes:** The abort tracking ref prevents stale data from rendering, but there's a brief window where multiple retries from an old request could still be in-flight. The fetchId check mitigates this.
- **Image loading performance:** All 12 images load at once on page change. `loading="lazy"` helps for below-fold images, but above-fold images could benefit from priority hints.
- **Select dropdown styling:** The `appearance: none` on the category dropdown removes the native arrow indicator. A custom chevron icon would improve the UX.
