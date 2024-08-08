import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Event } from '@cosmjs/cosmwasm-stargate';
import BigNumber from 'bignumber.js';

export enum XWalletType {
  ICON,
  COSMOS,
  EVM,
  EVM_ARBITRUM,
  EVM_AVALANCHE,
  EVM_BSC,
  EVM_BASE,
  HAVAH,
}

export type XChainId =
  | 'archway-1'
  | 'archway'
  | '0x1.icon'
  | '0x2.icon'
  | '0xa86a.avax'
  | '0xa869.fuji'
  | '0x100.icon'
  | '0x38.bsc'
  | '0xa4b1.arbitrum'
  | '0x2105.base';

export type XChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH';

export enum XCallEventType {
  CallMessageSent = 'CallMessageSent',
  CallMessage = 'CallMessage',
  ResponseMessage = 'ResponseMessage',
  RollbackMessage = 'RollbackMessage',
  CallExecuted = 'CallExecuted',
  RollbackExecuted = 'RollbackExecuted',
}

export type OriginXCallData = {
  sn: number;
  rollback?: boolean;
  rollbackRequired?: boolean;
  rollbackReady?: boolean;
  eventName: XCallEventType;
  chain: XChainId;
  destination: XChainId;
  autoExecute?: boolean;
  timestamp: number;
  descriptionAction: string;
  descriptionAmount: string;
  isPristine?: boolean;
};

export type DestinationXCallData = {
  sn: number;
  reqId: number;
  data: string;
  eventName: XCallEventType;
  chain: XChainId;
  origin: XChainId;
  autoExecute?: boolean;
  isPristine?: boolean;
};

export type XCallChainState = {
  origin: OriginXCallData[];
  destination: DestinationXCallData[];
};

export type XCallDirection = {
  origin: XChainId;
  destination: XChainId;
};

export enum CurrentXCallStateType {
  IDLE = 'IDLE',
  AWAKE = 'AWAKE',
  AWAITING_DESTINATION_CALL_MESSAGE = 'AWAITING_DESTINATION_CALL_MESSAGE',
  AWAITING_USER_CALL_EXECUTION = 'AWAITING_USER_CALL_EXECUTION',
  AWAITING_ORIGIN_ROLLBACK_MESSAGE = 'AWAITING_ORIGIN_ROLLBACK_MESSAGE',
  AWAITING_ORIGIN_RESPONSE_MESSAGE = 'AWAITING_ORIGIN_RESPONSE_MESSAGE',
}

// export const CurrentXCallState: { [key in CurrentXCallStateType]: CurrentXCallStateType } = Object.freeze({
//   IDLE: 'IDLE',
//   AWAKE: 'AWAKE',
//   AWAITING_DESTINATION_CALL_MESSAGE: 'AWAITING_DESTINATION_CALL_MESSAGE',
//   AWAITING_USER_CALL_EXECUTION: 'AWAITING_USER_CALL_EXECUTION',

//   // raised every time _rollback wasn't null
//   AWAITING_ORIGIN_RESPONSE_MESSAGE: 'AWAITING_ORIGIN_RESPONSE_MESSAGE',

//   // raised when _rollback wasn't null and executeCall failed - revert happened in execution
//   AWAITING_ORIGIN_ROLLBACK_MESSAGE: 'AWAITING_ORIGIN_ROLLBACK_MESSAGE',
// });

export type CrossChainTxType = {
  transactionHash: string;
  events: readonly Event[];
};

export type XCallActivityItem = {
  chain: XChainId;
  originData: OriginXCallData;
  destinationData?: DestinationXCallData;
  status: 'pending' | 'executable' | 'failed' | 'rollbackReady';
};

export interface IXCallFee {
  noRollback: bigint;
  rollback: bigint;
}

export type Chain = {
  id: string | number;
  name: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  rpc: {
    http: string;
    ws?: string;
  };
  tracker: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: XChainId;
  xChainType: XChainType;
  xWalletType: XWalletType;
  contracts: {
    xCall: string;
    assetManager: string;
    bnUSD?: string;
    liquidSwap?: string;
  };
  autoExecution: boolean;
  gasThreshold: number;
};

export enum MessagingProtocolId {
  BTP = 'BTP',
  IBC = 'IBC',
  // centralized relay
  C_RELAY = 'C_RELAY',
}

export type BridgePair = {
  chains: [XChainId, XChainId];
  protocol: MessagingProtocolId;
};

export interface MessagingProtocol {
  id: MessagingProtocolId;
  name: string;
  description: string;
}

export class XToken extends Token {
  xChainId: XChainId;
  identifier: string;

  public constructor(
    xChainId: XChainId,
    chainId: number | string,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    identifier?: string,
  ) {
    super(chainId, address, decimals, symbol, name);
    this.xChainId = xChainId;
    this.identifier = identifier || symbol;
  }

  static getXToken(xChainId: XChainId, token: Token) {
    return new XToken(xChainId, token.chainId, token.address, token.decimals, token.symbol, token.name);
  }
}

export type XTokenMap = { [key: string | number]: XToken };

export type XWalletAssetRecord = {
  baseToken: Token;
  xTokenAmounts: { [key in XChainId]: CurrencyAmount<Currency> | undefined };
  isBalanceSingleChain: boolean;
  total: BigNumber;
  value: BigNumber | undefined;
};

export type Position = {
  collateral: CurrencyAmount<Currency> | undefined;
  loan: BigNumber;
  isPotential?: boolean;
};

export type XPositions = { [CurrencyKey in string]: Partial<{ [key in XChainId]: Position }> };

export type XPositionsRecord = {
  baseToken: Token;
  positions: XPositions;
  isSingleChain: boolean;
  total?: Position;
};
