# Phase 3 Design: Responsive Design for Mobile & Tablet

**Date:** 2026-05-16  
**Project:** Recipe Manager  
**Phase:** 3 of 3  
**Status:** Design Approved

---

## Overview

Phase 3 makes the Recipe Manager fully responsive across all device sizes. Current design is optimized for desktop; this phase ensures usability and readability on tablets and mobile devices.

**Approach:** Desktop-optimized baseline → Progressive responsiveness for smaller screens  
**Priority:** Low (after Phase 1 & 2 complete)  
**Scope:** All pages and components

---

## Design Principles

1. **Desktop First:** Start with desktop layout, progressively simplify for smaller screens
2. **Touch-Friendly:** Buttons, inputs, and interactive elements sized for touch (min 44px × 44px)
3. **Readable Typography:** Font sizes scale appropriately (no text below 14px on mobile)
4. **Efficient Layouts:** Single-column on mobile, multi-column where beneficial on tablet/desktop
5. **Performance:** No additional assets; use CSS media queries only

---

## Breakpoints

Standard breakpoints across the entire app:

| Device Type | Screen Width | Layout |
|---|---|---|
| **Mobile** | < 640px | Single-column, stacked |
| **Tablet** | 640px — 1024px | Two-column where appropriate, optimized for portrait & landscape |
| **Desktop** | > 1024px | Current multi-column, full layout |

---

## Page-by-Page Responsive Adjustments

### 1. Navigation/Header
**Desktop:** Horizontal menu with logo, nav links, user profile, settings  
**Tablet (640px-1024px):** Same as desktop, adjust spacing  
**Mobile (< 640px):** 
- Hamburger menu icon
- Logo centered
- Drawer/collapsible navigation menu
- Profile/settings in menu

### 2. Recipe List/Dashboard
**Desktop:** Grid layout (2-3 columns), recipe cards with preview  
**Tablet (640px-1024px):** 2-column grid, recipe cards still visible  
**Mobile (< 640px):** 
- Single-column list
- Recipe cards stacked vertically
- Full-width cards for easy tapping
- Simplified card layout (title, short description, tap to expand)

### 3. Recipe Detail/View
**Desktop:** Two-column (left: instructions, right: nutrients/sidebar)  
**Tablet (640px-1024px):** 
- Responsive two-column if landscape
- Single-column if portrait
- Stack nutrients below instructions on narrow tablets

**Mobile (< 640px):** 
- Single-column, stacked layout
- Ingredients section full-width
- Instructions full-width
- Nutrients below (expandable sections to reduce scrolling)
- Larger text for readability while cooking

### 4. Recipe Create/Edit Form
**Desktop:** Two-column (left: form, right: preview/help)  
**Tablet (640px-1024px):** Single-column, form full-width  
**Mobile (< 640px):** 
- Single-column form
- Full-width inputs
- Grouped sections (ingredient, quantities, nutrients)
- Expandable sections to reduce cognitive load
- Larger inputs for touch

### 5. User Profile / Settings
**Desktop:** Two-column (sidebar nav, content area)  
**Tablet (640px-1024px):** Sidebar + content, adjust widths  
**Mobile (< 640px):** 
- Stack vertically
- Tabs or accordion for sections
- Settings as collapsible sections

---

## Responsive Components

### Buttons
**Desktop/Tablet:** Standard sizing (padding: 8px 16px, min-height: 40px)  
**Mobile:** Full-width or larger touch targets (min-height: 44px) for easier tapping

### Input Fields
**Desktop:** Standard width, label above or beside  
**Mobile:** Full-width, label always above, clear focus states, larger text (16px+)

### Cards
**Desktop:** Grid with flexbox, borders, shadows  
**Tablet/Mobile:** Single-column stacking, maintain readability, larger touch areas

### Tables (if any)
**Desktop:** Standard table layout  
**Mobile:** Convert to card-based layout or horizontal scroll container with left-stickable column

### Modals/Dialogs
**Desktop:** Centered modal, max-width 500px  
**Mobile:** Full-screen or near-full-screen modal, center content, easy close button

---

## Typography Scaling

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| **H1** | 32px | 28px | 24px |
| **H2** | 24px | 20px | 20px |
| **Body** | 16px | 15px | 14px |
| **Small** | 14px | 13px | 12px |
| **Min readable** | 14px | 13px | 14px* |

*Mobile never goes below 14px for body text to ensure readability.

---

## Spacing & Padding

**Desktop:** Standard spacing (16px/24px/32px gaps)  
**Tablet:** Reduce slightly (12px/18px/24px gaps)  
**Mobile:** Tighter spacing for efficiency (8px/12px/16px gaps)  

Maintain visual hierarchy and breathing room.

---

## Navigation Strategy

**Desktop:** Traditional horizontal nav + sidebar (if applicable)  
**Tablet:** Horizontal nav, adjust for smaller width  
**Mobile:** 
- Hamburger menu (3-line icon)
- Slide-out drawer or bottom navigation (if many nav items)
- Active state clearly indicated
- Easy to dismiss (tap outside, back button)

---

## Images & Media

**Desktop:** Full-size images, multi-column layouts  
**Tablet:** Scaled images, maintain aspect ratio  
**Mobile:** 
- Single-column, full-width images (max-width: 100%)
- Responsive image loading (srcset for different DPI)
- Lazy loading for performance
- No oversized images that slow mobile load

---

## Performance Considerations

- Use CSS media queries only (no JavaScript-based breakpoint switching if possible)
- Responsive images with `srcset` to avoid oversized assets on mobile
- Lazy loading for images below fold
- No layout shift on breakpoint changes (maintain aspect ratios)
- Test on actual devices, not just browser DevTools

---

## Testing Strategy

### Visual Testing
- Desktop: Current layout validated
- Tablet (landscape & portrait): All components functional and readable
- Mobile (portrait & landscape): All features accessible, no horizontal scroll

### Functional Testing
- Touch interactions: Buttons, forms, dropdowns work on touchscreen
- Navigation: Hamburger menu opens/closes, links navigate correctly
- Forms: Inputs expand on focus, keyboard appears, no cut-off fields
- Images: Scale correctly, load efficiently

### Device Testing
- iPhone (375px-430px width)
- iPad (768px-1024px width)
- Android phones (varies, test common sizes)
- Desktop (1280px+)

### Browser Testing
- Chrome, Firefox, Safari, Edge on respective devices
- Test on slow 3G to verify performance

---

## Rollout Plan

1. **Phase 3.1:** Core breakpoints & navigation (mobile-first nav)
2. **Phase 3.2:** Recipe list/dashboard responsive
3. **Phase 3.3:** Recipe detail/view responsive
4. **Phase 3.4:** Recipe create/edit form responsive
5. **Phase 3.5:** Settings/profile responsive
6. **Phase 3.6:** Polish & cross-browser testing

Each sub-phase can be tested and deployed independently.

---

## Success Metrics

**Phase 3 is complete when:**
- ✅ App is fully usable on mobile (375px width)
- ✅ App is fully usable on tablet (768px width)
- ✅ Desktop layout unchanged
- ✅ All interactive elements are touch-friendly (min 44px)
- ✅ Typography is readable on all sizes (14px+ body text)
- ✅ No horizontal scrolling on mobile (except overflow content)
- ✅ Performance acceptable on slow 3G
- ✅ Tested on real devices (not just browser DevTools)

---

## Low Priority Items (Defer)

These enhancements are out of scope for Phase 3 but could be future improvements:
- Native mobile app (React Native, Flutter)
- App installation (PWA manifest)
- Offline support (service workers)
- Advanced touch gestures (swipe, pinch)

---

## Notes

- Phase 3 is independent of Phase 1 & 2 — can be worked on in parallel or deferred
- Responsive design should not break existing desktop functionality
- All breakpoints should be documented in design system/Tailwind config (if using utilities)
- Update documentation with responsive image and asset handling guidelines

---

## References

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google: Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Apple: Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
