# Design System Specification: Cosmic Editorial

## 1. Overview & Creative North Star
### Creative North Star: "The Celestial Observer"
This design system is a departure from the clinical, cold dark modes of the past. It is an editorial experience that treats the screen as a vast, cosmic canvas. We avoid the "boxed-in" feeling of traditional SaaS tools by favoring expansive negative space, ethereal light sources, and intentional asymmetry.

The "Celestial Observer" aesthetic breaks the template through:
*   **Organic Depth:** Using volumetric glows and light-leaks rather than harsh shadows.
*   **Tonal Authority:** High-contrast typography paired with "vanishing" containers.
*   **The Warmth of the Void:** Combining a pure black vacuum (`#000000`) with the sophisticated heat of Amber-gold accents.

## 2. Colors & Surface Logic

### The Palette
The core of this system is the tension between the infinite black background and the radiant primary accent.

*   **Background (`surface-dim`):** `#131313` / `#000000`. The canvas must feel bottomless.
*   **Primary (`primary`):** `#ffc174`. Used for critical actions.
*   **Primary Container (`primary-container`):** `#f59e0b`. The signature Amber-gold. Used for high-visibility accents and states.
*   **Tertiary (`tertiary`):** `#8fd5ff`. A cool, stellar blue to balance the amber warmth, used sparingly for secondary information or interactive highlights.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Moving from `surface` (`#131313`) to `surface-container-low` (`#1c1b1b`).
2.  **Negative Space:** Using the `16` (5.5rem) or `24` (8.5rem) spacing tokens to create mental boundaries without visual clutter.

### Surface Hierarchy & Nesting
Treat the UI as layers of light and glass suspended in a vacuum.
*   **Base:** `surface` (`#131313`)
*   **Floating Panels:** `surface-container-lowest` (`#0e0e0e`) to create "recessed" areas.
*   **Interactive Cards:** `surface-container-high` (`#2a2a2a`) with a `backdrop-blur`.

### The "Glass & Gradient" Rule
To achieve a premium, volumetric feel, main CTAs and hero elements should utilize a **Signature Texture**: a linear gradient from `primary` (#ffc174) to `primary-container` (#f59e0b) at a 135-degree angle. Floating elements must use a 60% opacity on their surface color with a 20px-32px backdrop blur.

## 3. Typography
The typographic voice is thin, elegant, and unapologetically spacious.

*   **Display & Headline (Inter):** Set with a tracking (letter-spacing) of `-0.02em`. These should feel like a premium fashion editorial. The `display-lg` (3.5rem) is used for rare, high-impact moments.
*   **Title & Body (Inter):** Use `body-lg` (1rem) for most reading contexts. Ensure a line-height of at least 1.6 to maintain the "breathing" feel of the system.
*   **Labels (Manrope):** `label-md` (0.75rem) in Manrope provides a technical, precise counterpoint to the more fluid Inter headings. Use for metadata and overlines.

## 4. Elevation & Depth

### The Layering Principle
Depth is communicated through "Tonal Stacking." An inner card should not have a border; it should simply be one step higher on the `surface-container` scale than its parent.

### Ambient Shadows
Forget "Drop Shadows." We use **Ambient Volumetric Glows**. 
*   **Shadow Color:** Use a 5% opacity version of `surface-tint` (`#ffb95f`).
*   **Properties:** Blur: 40px - 80px, Spread: -10px. This creates a soft "aura" rather than a hard lift.

### The "Ghost Border" Fallback
If a border is required for accessibility, use the `outline-variant` (`#534434`) at **15% opacity**. This should appear as a faint suggestion of an edge, reminiscent of light catching the rim of a glass lens.

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`). White or `on-primary` text. No border. `lg` (0.5rem) roundedness.
*   **Secondary:** Ghost style. Transparent background, `Ghost Border` (15% `outline-variant`). On hover, the border transitions to 100% opacity `primary`.
*   **States:** Hovering over any interactive element should trigger a subtle `primary-container` (#f59e0b) outer glow (blur 15px, spread 2px).

### Cards & Lists
*   **Rule:** No dividers. 
*   **Implementation:** Use a `1.5` (0.5rem) vertical gap between list items, or place the item on a `surface-container-highest` background on hover.
*   **Glass-morphism:** Use `surface-container-low` at 70% opacity + `backdrop-filter: blur(12px)`.

### Input Fields
*   **Base:** `surface-container-lowest`. 
*   **Focus:** The "Ghost Border" becomes a solid `primary` stroke, accompanied by a volumetric amber glow.
*   **Label:** `label-sm` in `on-surface-variant`, positioned 8px above the field.

### Tooltips
*   **Style:** `surface-container-highest` with 90% opacity. `sm` (0.125rem) roundedness. Use `label-md` for text.

## 6. Do's and Don'ts

### Do:
*   **Embrace the Dark:** Let large areas of the screen remain pure `#000000`.
*   **Use Asymmetry:** Offset your text blocks and images to create an intentional, curated look.
*   **Trust the Spacing:** When in doubt, increase the margin. Use the `20` (7rem) token for section padding.

### Don't:
*   **Don't use pure white text:** Use `on-surface` (`#e5e2e1`) to avoid harsh eye strain.
*   **Don't use solid borders:** Never use a 100% opaque, high-contrast border for a container.
*   **Don't crowd elements:** This system fails if the "Space-inspired" feeling is lost to clutter. If the UI feels busy, remove containers, don't add lines.
*   **Don't use default "Blue" links:** All interactive highlights must use the `primary` (Amber) or `tertiary` (Stellar Blue) tokens.