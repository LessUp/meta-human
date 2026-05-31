/**
 * Service layer barrel export.
 *
 * React service container module - provides service instances via Context API.
 */

export { ServicesProvider } from './ServicesProvider';
export { ServicesContext } from './servicesContext';
export { useASR, useDialogue, useEngine, useServices, useTTS } from './serviceHooks';
export type { Services } from '@/core/serviceComposition';
