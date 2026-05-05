# Component Guidelines

> How components are built in this project.

---

## Overview

Components are primarily presentational. Business logic lives in hooks and core services. State is managed by Zustand stores.

---

## Component Structure

```typescript
// 1. Imports (grouped: external → internal → types)
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { loggers } from '../lib/logger';
import type { DeviceCapabilities } from '../core/performance';

// 2. Named constants (not magic numbers)
const ANIMATION_DURATION_MS = 300;

// 3. Types
interface DigitalHumanViewerProps {
  modelUrl?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  onModelLoad?: (model: unknown) => void;
}

// 4. Component
export default function DigitalHumanViewer({
  modelUrl,
  autoRotate = false,
  showControls = true,
  onModelLoad,
}: DigitalHumanViewerProps) {
  // Hooks at the top
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const deviceCaps = useMemo(() => getDeviceCapabilities(), []);

  // Early returns for loading/error states
  if (!modelUrl) {
    return <FallbackAvatar />;
  }

  // Main render
  return (
    <div role="application" aria-label="3D数字人模型查看器">
      {/* ... */}
    </div>
  );
}
```

---

## Props Conventions

### Default Values

Use destructuring with defaults for optional props:

```typescript
// ✅ Good
interface Props {
  autoRotate?: boolean;
  showControls?: boolean;
}

export function Viewer({ autoRotate = false, showControls = true }: Props) {
  // ...
}

// ❌ Avoid: Default values in prop types
interface Props {
  autoRotate?: boolean; // defaults to false
}
```

### Callback Props

Name callback props with `on` prefix:

```typescript
interface Props {
  onModelLoad?: (model: unknown) => void;
  onError?: (error: string) => void;
}
```

### Use Refs for Callbacks

Store callbacks in refs to avoid re-triggering effects:

```typescript
// ✅ Good: Ref for callback to avoid dependency issues
const onModelLoadRef = useRef(onModelLoad);
onModelLoadRef.current = onModelLoad;

useEffect(
  () => {
    // Use onModelLoadRef.current inside effect
    onModelLoadRef.current?.(result);
  },
  [
    /* no onModelLoad dependency */
  ],
);
```

---

## Styling Patterns

This project uses **Tailwind CSS 4** with the `@tailwindcss/vite` plugin.

### Utility-First

```typescript
// ✅ Good: Utility classes
<div className="w-full h-full bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl">

// ❌ Avoid: Custom CSS unless necessary
<div className="custom-viewer-container">
```

### Responsive Design

Use Tailwind's responsive prefixes:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Accessibility Classes

Include screen reader text:

```typescript
<div className="sr-only">使用方向键旋转视图</div>
```

---

## Accessibility

### Required Attributes

Interactive components must include:

```typescript
<div
  role="application"
  aria-label="3D数字人模型查看器"
  tabIndex={0}
>
  <div className="sr-only">键盘操作说明</div>
</div>
```

### Live Regions

For dynamic content updates:

```typescript
<span aria-live="polite">{loadStatus}</span>
<div role="alert">{errorMessage}</div>
```

---

## Common Mistakes

### ❌ Calling fetch directly in components

```typescript
// ❌ Wrong: Direct fetch in component
useEffect(() => {
  fetch('/api/chat').then(/* ... */);
}, []);

// ✅ Correct: Use dialogueService
import { dialogueService } from '@/core/dialogue/dialogueService';

useEffect(() => {
  dialogueService.chat(message).then(/* ... */);
}, []);
```

### ❌ Skipping useEffect cleanup

```typescript
// ❌ Wrong: No cleanup
useEffect(() => {
  window.addEventListener('keydown', handler);
}, []);

// ✅ Correct: Always return cleanup
useEffect(() => {
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [handler]);
```

### ❌ Destructuring entire store

```typescript
// ❌ Wrong: Causes unnecessary re-renders
const { isPlaying, isRecording, ...rest } = useDigitalHumanStore();

// ✅ Correct: Select only what you need
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
const isRecording = useDigitalHumanStore((s) => s.isRecording);
```
