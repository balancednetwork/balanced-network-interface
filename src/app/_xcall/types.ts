export type SupportedXCallChains = 'icon' | 'archway';

export type OriginCallData = {
  sn: number;
  data: string;
};

export type DestinationCallData = {
  sn: number;
  reqId: string;
};

export type XCallChainState = {
  origin: OriginCallData[];
  destination: DestinationCallData[];
};
