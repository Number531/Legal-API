---
name: web-design
description: Expert frontend engineering for modern, accessible web interfaces. Auto-invoked for UI generation, component design, and styling tasks.
---

# Frontend UI Generation Skill

You are an expert frontend engineer specializing in creating exceptional, interactive, minimalist interfaces that rival the quality of billion-dollar companies like Linear, Vercel, Stripe, and Raycast.

## Anti-AI-Slop Guidelines

Avoid generic AI aesthetics that make designs look templated:

### Typography - Avoid Generic Fonts
- **Never use**: Inter, Roboto, Open Sans, Lato, system defaults without intention
- **Prefer distinctive fonts**:
  - `JetBrains Mono` - Code, technical interfaces
  - `Geist` / `Geist Mono` - Modern tech (Vercel's choice)
  - `IBM Plex Sans/Mono` - Technical, trustworthy
  - `Bricolage Grotesque` - Distinctive, editorial
  - `Playfair Display` - Editorial, luxury
  - `Space Grotesk` - Modern, geometric

### Color - Avoid Purple Gradients on White
- Skip the default purple/violet AI aesthetic
- Use atmospheric, intentional color palettes
- Consider: deep blacks, warm neutrals, single accent colors
- Gradients should be subtle and purposeful, not decorative

### Backgrounds - Avoid Flat Solid Colors
- Use subtle textures, noise, or gradients
- Consider atmospheric depth with layered elements
- Glassmorphism and blur effects when appropriate

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## Design Philosophy

### Core Principles

1. **Ruthless Minimalism**: Every element must earn its place. Remove until it breaks, then add back one thing.
2. **Purposeful Whitespace**: Generous spacing creates hierarchy and breathing room. Never crowd elements.
3. **Subtle Depth**: Use shadows, borders, and gradients sparingly to create depth without visual noise.
4. **Micro-interactions**: Small animations acknowledge user actions and create delight.
5. **Information Density**: Show what matters, hide what doesn't. Progressive disclosure over overwhelming.

### Dark Theme Palette

```css
/* Primary Background - Deep, rich blacks */
--background: 0 0% 3.9%;           /* hsl(0, 0%, 3.9%) - Near black */
--background-subtle: 0 0% 7%;       /* Slightly lighter for cards */

/* Foreground - Crisp whites with hierarchy */
--foreground: 0 0% 98%;             /* Primary text */
--foreground-muted: 0 0% 63.9%;     /* Secondary text */
--foreground-subtle: 0 0% 45%;      /* Tertiary/disabled text */

/* Borders - Subtle separation */
--border: 0 0% 14.9%;               /* Default borders */
--border-subtle: 0 0% 10%;          /* Subtle dividers */

/* Accent - Brand color (customize per project) */
--accent: 210 100% 50%;             /* Electric blue */
--accent-foreground: 0 0% 100%;

/* Semantic Colors */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;

/* Interactive States */
--hover: 0 0% 8%;
--active: 0 0% 12%;
--focus-ring: 210 100% 50% / 50%;
```

---

## Component Patterns

### Layout Structure

```tsx
// app/layout.tsx - Using Geist instead of Inter
import { GeistSans, GeistMono } from 'geist/font'
import { cn } from '@/lib/utils'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}>
        {children}
      </body>
    </html>
  )
}
```

### Page Layout Pattern

```tsx
// Consistent page structure
export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Nav content */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Footer content */}
        </div>
      </footer>
    </div>
  )
}
```

### Card Component

```tsx
// Premium card with subtle glow effect
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'group relative rounded-xl border border-border/50 bg-background-subtle p-6',
      'transition-all duration-300 ease-out',
      'hover:border-border hover:bg-background-subtle/80',
      'hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]',
      className
    )}>
      {children}
    </div>
  )
}
```

### Button Variants

```tsx
// Primary action button
<Button className={cn(
  'bg-foreground text-background font-medium',
  'hover:bg-foreground/90',
  'focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'transition-all duration-200'
)}>
  Get Started
</Button>

// Secondary/Ghost button
<Button variant="ghost" className={cn(
  'text-foreground-muted',
  'hover:text-foreground hover:bg-hover',
  'transition-all duration-200'
)}>
  Learn More
</Button>

// Accent button with glow
<Button className={cn(
  'bg-accent text-accent-foreground font-medium',
  'hover:bg-accent/90',
  'shadow-[0_0_20px_-5px_hsl(var(--accent))]',
  'hover:shadow-[0_0_30px_-5px_hsl(var(--accent))]',
  'transition-all duration-300'
)}>
  Upgrade
</Button>
```

### Input Fields

```tsx
// Sleek input with focus states
<Input
  className={cn(
    'h-11 rounded-lg border-border/50 bg-background',
    'placeholder:text-foreground-subtle',
    'focus:border-foreground/20 focus:ring-1 focus:ring-foreground/10',
    'transition-all duration-200'
  )}
  placeholder="Enter your email"
/>

// Search input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
  <Input
    className={cn(
      'h-10 pl-10 rounded-lg border-border/50 bg-background',
      'focus:border-foreground/20 focus:bg-hover',
      'transition-all duration-200'
    )}
    placeholder="Search..."
  />
  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-subtle bg-hover px-1.5 py-0.5 rounded">
    K
  </kbd>
</div>
```

---

## Animation Patterns

### Fade Up on Scroll

```tsx
'use client'
import { motion } from 'framer-motion'

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98] // Custom easing
      }}
    >
      {children}
    </motion.div>
  )
}
```

### Stagger Children

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((text, i) => (
        <motion.li key={i} variants={item}>
          {text}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### Hover Scale

```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  <Card>Interactive Card</Card>
</motion.div>
```

### Smooth Height Animation

```tsx
<motion.div
  initial={false}
  animate={{ height: isOpen ? 'auto' : 0 }}
  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
  className="overflow-hidden"
>
  {content}
</motion.div>
```

---

## Typography System

```tsx
// Heading hierarchy
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
  Build faster
</h1>

<h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
  Features
</h2>

<h3 className="text-lg font-medium text-foreground">
  Section Title
</h3>

// Body text
<p className="text-base text-foreground-muted leading-relaxed">
  Description text with comfortable reading line height.
</p>

// Small/Caption text
<span className="text-sm text-foreground-subtle">
  Metadata or secondary info
</span>

// Gradient text (accent)
<span className="bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent">
  Highlighted text
</span>
```

---

## Common Patterns

### Hero Section

```tsx
function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-accent/20 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-hover px-4 py-1.5 text-sm text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Now available in beta
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
          Build products that{' '}
          <span className="text-accent">customers love</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto mb-10">
          The modern platform for teams who ship fast.
          Stop wrestling with tools and start building.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
            Start Building
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-border/50 hover:bg-hover">
            View Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
```

### Feature Grid

```tsx
function Features() {
  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Sub-millisecond response times' },
    { icon: Shield, title: 'Secure by Default', description: 'Enterprise-grade security' },
    { icon: Palette, title: 'Beautiful UI', description: 'Pixel-perfect components' },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Everything you need
          </h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
            Built for developers who demand excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="group">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-foreground-muted">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Data Table

```tsx
function DataTable() {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-hover/50">
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-subtle uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-subtle uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-foreground-subtle uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-hover/50 transition-colors">
              <td className="px-6 py-4 text-sm text-foreground">{row.name}</td>
              <td className="px-6 py-4">
                <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Command Menu (K)

```tsx
'use client'
import { Command } from 'cmdk'

function CommandMenu() {
  return (
    <Command className="rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden">
      <Command.Input
        className="w-full px-4 py-3 text-foreground placeholder:text-foreground-subtle bg-transparent border-b border-border/50 outline-none"
        placeholder="Type a command or search..."
      />
      <Command.List className="max-h-[300px] overflow-y-auto p-2">
        <Command.Empty className="py-6 text-center text-sm text-foreground-subtle">
          No results found.
        </Command.Empty>

        <Command.Group heading="Actions" className="mb-2">
          <Command.Item className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-muted hover:bg-hover hover:text-foreground cursor-pointer transition-colors">
            <Plus className="h-4 w-4" />
            Create new...
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command>
  )
}
```

---

## Accessibility Checklist

- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Focus states visible and consistent
- [ ] Keyboard navigation works throughout
- [ ] Screen reader labels on icons and interactive elements
- [ ] Reduced motion preference respected
- [ ] Touch targets minimum 44x44px on mobile

```tsx
// Respect reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.5
  }}
/>
```

---

## Performance Best Practices

1. **Images**: Use `next/image` with proper sizing and lazy loading
2. **Fonts**: Use `next/font` for zero layout shift
3. **Components**: Mark client components only when needed (`'use client'`)
4. **Animations**: Use CSS transforms (not layout properties)
5. **Bundle**: Tree-shake unused components from shadcn/ui

---

## File Structure

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── globals.css         # Tailwind directives + CSS variables
└── (routes)/
    └── dashboard/
        └── page.tsx

components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── layout/             # Layout components
│   ├── navbar.tsx
│   └── footer.tsx
└── sections/           # Page sections
    ├── hero.tsx
    └── features.tsx

lib/
├── utils.ts            # cn() helper
└── constants.ts        # Shared constants
```

---

## When Generating UI

1. **Ask**: What is the primary user action on this page?
2. **Simplify**: Remove any element that doesn't serve that action
3. **Contrast**: Ensure visual hierarchy guides the eye
4. **Polish**: Add subtle animations and hover states
5. **Test**: Verify dark mode looks intentional, not inverted

Always ship less. The best interface is one that disappears.
