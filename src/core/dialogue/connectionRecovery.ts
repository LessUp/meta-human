import type { ChatTransportMode } from './chatTransport';

type RecoveryStatus = 'connected' | 'disconnected' | 'error';
type RecoveryFailureStatus = Exclude<RecoveryStatus, 'connected'>;
type ConcreteChatTransportMode = Exclude<ChatTransportMode, 'auto'>;

export interface ConnectionRecoveryOptions {
  unhealthyStatus: RecoveryFailureStatus;
  unhealthyReason: string;
  transportProbeFailureMessage: string;
  forceTransportProbe?: boolean;
}

export interface ConnectionRecoveryDependencies {
  checkServerHealth: () => Promise<boolean>;
  resolveTransportMode: (options: { forceProbe: boolean }) => Promise<ConcreteChatTransportMode>;
  performanceNow?: () => number;
  now?: () => number;
}

export interface ConnectionRecoveryResult {
  status: RecoveryStatus;
  checkedAt: number;
  latencyMs: number;
  degradedReason: string | null;
  transportMode: ConcreteChatTransportMode | null;
  transportIssue: string | null;
}

export async function evaluateConnectionRecovery(
  options: ConnectionRecoveryOptions,
  dependencies: ConnectionRecoveryDependencies,
): Promise<ConnectionRecoveryResult> {
  const startedAt = (dependencies.performanceNow ?? performance.now.bind(performance))();
  const isHealthy = await dependencies.checkServerHealth();
  const checkedAt = (dependencies.now ?? Date.now)();
  const latencyMs = Math.max(
    0,
    Math.round((dependencies.performanceNow ?? performance.now.bind(performance))() - startedAt),
  );

  if (!isHealthy) {
    return {
      status: options.unhealthyStatus,
      checkedAt,
      latencyMs,
      degradedReason: options.unhealthyReason,
      transportMode: null,
      transportIssue: null,
    };
  }

  try {
    const transportMode = await dependencies.resolveTransportMode({
      forceProbe: options.forceTransportProbe ?? false,
    });

    return {
      status: 'connected',
      checkedAt,
      latencyMs,
      degradedReason: null,
      transportMode,
      transportIssue: null,
    };
  } catch {
    return {
      status: 'connected',
      checkedAt,
      latencyMs,
      degradedReason: null,
      transportMode: null,
      transportIssue: options.transportProbeFailureMessage,
    };
  }
}
