export interface DialogueEndpointRoutingState {
  activeEndpoint: string;
  didFailover: boolean;
}

export class DialogueEndpointRouter {
  private readonly endpoints: string[];
  private activeEndpoint: string;

  constructor(endpoints: string[]) {
    const uniqueEndpoints = Array.from(new Set(endpoints.filter(Boolean)));
    this.endpoints = uniqueEndpoints.length > 0 ? uniqueEndpoints : ['http://localhost:8000'];
    this.activeEndpoint = this.endpoints[0];
  }

  selectPrimaryEndpoint(): string {
    return this.activeEndpoint;
  }

  getCandidateEndpoints(preferredEndpoint?: string): string[] {
    if (preferredEndpoint && this.endpoints.includes(preferredEndpoint)) {
      return [
        preferredEndpoint,
        ...this.endpoints.filter((endpoint) => endpoint !== preferredEndpoint),
      ];
    }

    return [
      this.activeEndpoint,
      ...this.endpoints.filter((endpoint) => endpoint !== this.activeEndpoint),
    ];
  }

  reportSuccess(endpoint: string): DialogueEndpointRoutingState {
    if (!this.endpoints.includes(endpoint)) {
      return { activeEndpoint: this.activeEndpoint, didFailover: false };
    }

    const didFailover = endpoint !== this.activeEndpoint;
    this.activeEndpoint = endpoint;
    return { activeEndpoint: this.activeEndpoint, didFailover };
  }

  reportFailure(endpoint: string): DialogueEndpointRoutingState {
    if (endpoint !== this.activeEndpoint) {
      return { activeEndpoint: this.activeEndpoint, didFailover: false };
    }

    const nextEndpoint = this.endpoints.find((candidate) => candidate !== endpoint);
    if (!nextEndpoint) {
      return { activeEndpoint: this.activeEndpoint, didFailover: false };
    }

    this.activeEndpoint = nextEndpoint;
    return { activeEndpoint: this.activeEndpoint, didFailover: true };
  }

  resetActiveEndpoint(endpoint?: string): void {
    if (endpoint && this.endpoints.includes(endpoint)) {
      this.activeEndpoint = endpoint;
      return;
    }

    this.activeEndpoint = this.endpoints[0];
  }
}
