# Product Requirements Document (PRD): Turn Complete Website Into 3D Experience

## Objective
Transform Examirror into an immersive, interactive 3D web experience with realistic depth layering, GSAP 3D tilt interactions, floating perspective elements, and tactile 3D pressable controls while maintaining lightning-fast performance and clean aesthetics.

## Ralph Loop Task Checklist
- [x] **Task 1: Global 3D Perspective & Depth Layering System**
  - Add `@keyframes float3d`, `.card-3d-elevated`, `.btn-3d-tactile`, and `.perspective-1000` depth utilities in `frontend/src/index.css`.

- [x] **Task 2: 3D Interactive Hero Section with Floating Perspective**
  - Upgrade hero section in `frontend/src/pages/public/Home.tsx` with floating 3D perspective layers, tactile 3D buttons, and ambient depth lighting.

- [x] **Task 3: Interactive 3D Impact Stats Counters**
  - Convert the 4 milestone stat cards in `frontend/src/pages/public/Home.tsx` into interactive `Tilt3DCard` elements with glossy glare reflection and 3D transform depth.

- [x] **Task 4: Real-Time Verification Gateway 3D Transformation**
  - Upgrade Center, Student, and Certificate verification cards in `frontend/src/pages/public/Home.tsx` with `Tilt3DCard`, layered 3D icons, and tactile search actions.

- [x] **Task 5: 3D Test Series & Elite Pass Showcase Elevation**
  - Enhance Test Series cards and Elite Pass showcase with interactive 3D perspective tilt, glossy glare sweep, and depth badges.

- [x] **Task 6: Footer and Mobile Dock Completion**
  - Finish the currently pending footer and dock work in `PublicLayout.tsx`.
  - Verify links, safe areas with `env(safe-area-inset-bottom)`, overlap prevention, keyboard access, and 3D glassmorphic mobile dock styling.

- [x] **Task 7: Motion and 3D Architecture Audit**
  - Audit existing dependencies and reusable components (`Tilt3DCard`, GSAP, Framer Motion).
  - Establish a shared motion policy, `prefers-reduced-motion` handling in CSS and JS, and graceful WebGL / CSS fallbacks without duplicate systems.

- [x] **Task 8: Hero Depth / 3D Focal Point**
  - Implement a purposeful hero depth composition with isolated 3D component and lightweight perspective geometry.
  - Include loading, error, reduced-motion, and mobile fallbacks.

- [x] **Task 9: Consistent Depth System for Feature Sections**
  - Apply shared elevation, perspective, and motion rules to features, courses, and interactive learning journeys.
  - Preserve content readability, keyboard focus, and all existing actions.

- [ ] **Task 10: Portal and Exam Flow Regression Audit**
  - Audit role-specific routes (student, center, admin) and high-focus exam pages.
  - Ensure no decorative 3D effects impair exam timing, question selection, answer submission, or authorization.

- [ ] **Task 11: Accessibility, Responsive, and Performance Verification**
  - Test reduced motion, keyboard navigation, contrast, viewport reflow across 320px–1440px, and WebGL fallbacks.
  - Record measured outcomes.

- [ ] **Task 12: Final Build and Regression Sign-off**
  - Run all project checks (`npm run build`, lint/type check).
  - Resolve any regressions and record the final status in `progress.txt`.