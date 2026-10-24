# Examirror — 3D Website Transformation Specification
File: 3D_WEBSITE_TRANSFORMATION.md
Project: Examirror educational and assessment platform
Workflow: Ralph Loop (prd.md + progress.txt)
Document date: 2026-10-24
Status: Implementation specification

## 1. Mission
Transform Examirror into a premium, responsive, interactive 3D educational platform while preserving its existing product functionality, routing, authentication, role permissions, APIs, data contracts, SEO, and accessibility.

The result must feel intentionally three-dimensional—not merely like a flat website with gradients. Use a layered approach:
1. CSS depth: perspective, layered surfaces, shadows, lighting, depth-aware hover states.
2. Motion: scroll-triggered reveals, restrained parallax, smooth state transitions, reduced-motion support.
3. Real 3D: a small number of purposeful Three.js / React Three Fiber scenes or 3D assets where they add educational or brand value.
4. Fallbacks: meaningful static or CSS alternatives when WebGL is unavailable, performance is low, or reduced motion is enabled.

Do not rebuild the application from scratch. Inspect the existing repository and extend its established architecture.

## 2. Existing Ralph Loop Context
Tasks to append and track:
- Task 6: Footer and Mobile Dock Completion
- Task 7: Motion and 3D Architecture Audit
- Task 8: Hero Depth / 3D Focal Point
- Task 9: Consistent Depth System for Feature Sections
- Task 10: Portal and Exam Flow Regression Audit
- Task 11: Accessibility, Responsive, and Performance Verification
- Task 12: Final Build and Regression Sign-off

## 3. Non-Negotiable Product and Engineering Rules
- Preserve all existing routes, page content, forms, exam flows, dashboards, authentication, permissions, and API behaviour.
- Do not replace real functionality with mock data or decorative controls.
- Do not make the entire site depend on WebGL.
- Do not add a large 3D library without first checking whether it is already installed and whether the bundle cost is justified.
- Do not add multiple animation libraries that overlap in purpose. Reuse existing libraries where possible.
- Do not use continuous animation for every card or every section.
- Do not make scroll hijacking, forced camera movement, cursor-following effects, or animation delay interfere with reading or navigation.
- Do not use sound that autoplays.
- Do not expose private student data, exam results, tokens, or account details in decorative scenes.
- Respect the platform's established design system and existing role-based access rules.
- Keep changes focused, maintainable, typed, and testable.
