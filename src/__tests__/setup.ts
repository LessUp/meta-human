import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Web APIs
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    speaking: false,
    onvoiceschanged: null
  }
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: class MockSpeechSynthesisUtterance {
    text: string;
    lang: string = '';
    rate: number = 1;
    pitch: number = 1;
    volume: number = 1;
    voice: any = null;
    onstart: any = null;
    onend: any = null;
    onerror: any = null;
    
    constructor(text: string) {
      this.text = text;
    }
  }
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: class MockSpeechRecognition {
    start = vi.fn();
    stop = vi.fn();
    continuous = false;
    interimResults = false;
    lang = '';
    onstart = null;
    onresult = null;
    onerror = null;
    onend = null;
  }
})

// Mock Three.js related modules
vi.mock('three', () => ({
  BoxGeometry: vi.fn(),
  SphereGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(() => ({ color: 0xffffff, metalness: 0, roughness: 1 })),
  Mesh: vi.fn(() => ({ 
    position: { set: vi.fn(), y: 0 }, 
    rotation: { y: 0 },
    add: vi.fn()
  })),
  Group: vi.fn(() => ({ add: vi.fn(), children: [] })),
  Vector3: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
  Color: vi.fn(() => ({ r: 1, g: 1, b: 1 }))
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'canvas' }, children),
  useFrame: vi.fn((callback) => callback({ clock: { elapsedTime: 0 } })),
  useThree: vi.fn(() => ({ scene: { add: vi.fn() } }))
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => React.createElement('div', { 'data-testid': 'orbit-controls' }, 'OrbitControls'),
  Environment: () => React.createElement('div', { 'data-testid': 'environment' }, 'Environment'),
  Html: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'html' }, children),
  useGLTF: vi.fn(() => ({ scene: {} })),
  Text: () => React.createElement('div', { 'data-testid': 'text' }, 'Text'),
  gridHelper: () => React.createElement('div', { 'data-testid': 'grid-helper' }, 'GridHelper')
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
} as any