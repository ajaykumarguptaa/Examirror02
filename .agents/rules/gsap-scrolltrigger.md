# GSAP (GreenSock) & ScrollTrigger Architecture Standards

## 1. Core Principles & Philosophy
- **Official Source of Truth**: All animations follow the official GSAP v3 documentation ([https://gsap.com/docs/v3/](https://gsap.com/docs/v3/)).
- **Performance First**: Animate composited properties only (`x`, `y`, `scale`, `rotation`, `opacity`). Never animate layout properties (`width`, `height`, `top`, `left`, `margin`) unless strictly necessary with layout containment.
- **Intentional Motion**: Avoid excessive, distracting movement. Motion must clarify hierarchy, guide focus, and provide tactile delight.
- **Strict Cleanup**: Every animation and ScrollTrigger instance must be safely cleaned up on component unmount or route transition to prevent memory leaks and zombie scroll listeners.

---

## 2. React + TypeScript Integration with `@gsap/react`

### A. Plugin Registration
Always register GSAP plugins once globally or before invocation:
```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);
```

### B. Standard `useGSAP()` Pattern
Always scope animations using a container `useRef`:
```tsx
import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const ModernAnimatedSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Select elements scoped strictly inside containerRef
    const cards = gsap.utils.toArray<HTMLElement>('.animated-card');

    gsap.from(cards, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef }); // Automatically reverts & kills ScrollTriggers on unmount

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div className="animated-card">Card 1</div>
      <div className="animated-card">Card 2</div>
    </div>
  );
};
```

---

## 3. ScrollTrigger Mechanics & Configuration

| Property | Recommended Pattern | Note |
|---|---|---|
| `trigger` | DOM Element or selector | Use `ref.current` whenever possible |
| `start` | `'top 80%'` or `'top top'` | First param: trigger element; Second param: viewport |
| `end` | `'+=100%'` or `'bottom top'` | Relative or absolute end point |
| `scrub` | `true` or numeric (`0.5` - `1.2`) | Numeric scrub adds buttery momentum |
| `pin` | `true` or selector | Locks element in place during scrub |
| `pinSpacing` | `true` (default) or `false` | Maintains or suppresses spacing |
| `invalidateOnRefresh` | `true` | Essential for dynamic heights and responsive layouts |
| `anticipatePin` | `1` | Prevents slight visual jumps on pin entry |
| `toggleActions` | `'play none none reverse'` | (onEnter, onLeave, onEnterBack, onLeaveBack) |

---

## 4. Responsive Animations with `gsap.matchMedia()`

Never calculate manual `window.innerWidth` resize handlers. Use `gsap.matchMedia()`:
```ts
useGSAP(() => {
  const mm = gsap.matchMedia();

  // Desktop only animations (> 1024px)
  mm.add('(min-width: 1024px)', () => {
    gsap.to('.pinned-hero', {
      scrollTrigger: {
        trigger: '.hero-wrapper',
        start: 'top top',
        end: '+=800',
        pin: true,
        scrub: 1,
      },
      scale: 1.15,
      opacity: 0.8,
    });
  });

  // Mobile fallback (< 1023px)
  mm.add('(max-width: 1023px)', () => {
    gsap.from('.pinned-hero', {
      opacity: 0,
      y: 20,
      duration: 0.6,
    });
  });

  // Respect reduced motion
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('*', { clearProps: 'all' });
  });
}, { scope: containerRef });
```

---

## 5. Master Animation Recipes

### Recipe 1: Horizontal Scroll Gallery
```ts
useGSAP(() => {
  const scroller = trackRef.current;
  if (!scroller) return;

  const totalScroll = scroller.scrollWidth - window.innerWidth;

  gsap.to(scroller, {
    x: -totalScroll,
    ease: 'none',
    scrollTrigger: {
      trigger: containerRef.current,
      start: 'top top',
      end: () => `+=${totalScroll}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}, { scope: containerRef });
```

### Recipe 2: Elastic Micro-Interactions (GSAP Elastic)
```ts
export const triggerElasticBounce = (target: HTMLElement | null) => {
  if (!target) return;
  gsap.fromTo(
    target,
    { scale: 0.93 },
    { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.3)' }
  );
};
```

### Recipe 3: Parallax Depth Layers
```ts
useGSAP(() => {
  gsap.to('.parallax-bg', {
    yPercent: -25,
    ease: 'none',
    scrollTrigger: {
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
}, { scope: containerRef });
```

---

## 6. Pre-flight Quality & Debugging Checklist
1. **No Duplicate Triggers**: Is `@gsap/react` `useGSAP` or `gsap.context()` utilized to prevent React Strict Mode duplicate listeners?
2. **Proper Cleanup**: Did all ScrollTriggers die cleanly when routing away?
3. **No Horizontal Overflow**: Did pins add unexpected body scrollbars? (Check `overflow-x: clip` or `pinSpacing`).
4. **Fast Scrolling Safety**: Does reverse scrolling or rapid jumping break visual state? (Use `fastScrollEnd: true` or `toggleActions: 'play none none reverse'`).
5. **No Style Conflicts**: Ensure CSS `transition` is **NOT** declared on the same property being animated by GSAP (`transform`, `opacity`).
