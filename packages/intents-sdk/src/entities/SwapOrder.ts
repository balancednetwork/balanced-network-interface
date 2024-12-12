import { fromBytes } from 'viem';

interface ISwapOrder {
  id: bigint; // uint256 -> BigInt (to handle large numbers)
  emitter: string; // string -> string
  srcNID: string; // string -> string
  dstNID: string; // string -> string
  creator: string; // string -> string
  destinationAddress: string; // string -> string
  token: string; // string -> string
  amount: bigint; // uint256 -> BigInt
  toToken: string; // string -> string
  toAmount: bigint; // uint256 -> BigInt
  data: Uint8Array; // bytes -> Uint8Array for raw byte data
}

export type ISwapOrderArgs = Readonly<{
  id: bigint;
  emitter: string;
  srcNID: string;
  dstNID: string;
  creator: string;
  destinationAddress: string;
  token: string;
  amount: bigint;
  toToken: string;
  toAmount: bigint;
  data: `0x${string}`;
}>;

export class SwapOrder implements ISwapOrder {
  id: bigint;
  emitter: string;
  srcNID: string;
  dstNID: string;
  creator: string;
  destinationAddress: string;
  token: string;
  amount: bigint;
  toToken: string;
  toAmount: bigint;
  data: Uint8Array;

  public PERMIT2_STRUCT = [
    { name: 'id', type: 'uint256' },
    { name: 'emitter', type: 'string' },
    { name: 'srcNID', type: 'string' },
    { name: 'dstNID', type: 'string' },
    { name: 'creator', type: 'string' },
    { name: 'destinationAddress', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'amount', type: 'uint256' },
    { name: 'toToken', type: 'string' },
    { name: 'toAmount', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ];

  constructor(
    id: bigint,
    emitter: string,
    srcNID: string,
    dstNID: string,
    creator: string,
    destinationAddress: string,
    token: string,
    amount: bigint,
    toToken: string,
    toAmount: bigint,
    data: Uint8Array,
  ) {
    this.id = id;
    this.emitter = emitter;
    this.srcNID = srcNID;
    this.dstNID = dstNID;
    this.creator = creator;
    this.destinationAddress = destinationAddress;
    this.token = token;
    this.amount = amount;
    this.toToken = toToken;
    this.toAmount = toAmount;
    this.data = data;
  }

  // public toData(): ISwapIntentArgs {
  //     return [
  //         this.id,                      // uint256 -> BigInt
  //         this.emitter,                 // string
  //         this.srcNID,                  // string
  //         this.dstNID,                  // string
  //         this.creator,                 // string
  //         this.destinationAddress,      // string
  //         this.token,                   // string
  //         this.amount,                  // uint256 -> BigInt
  //         this.toToken,                 // string
  //         this.toAmount,                // uint256 -> BigInt
  //         fromBytes(this.data, "hex")                     // bytes -> Uint8Array
  //     ];
  // }

  public toObjectData(): ISwapOrderArgs {
    return {
      id: this.id,
      emitter: this.emitter,
      srcNID: this.srcNID,
      dstNID: this.dstNID,
      creator: this.creator,
      destinationAddress: this.destinationAddress,
      token: this.token,
      amount: this.amount,
      toToken: this.toToken,
      toAmount: this.toAmount,
      data: fromBytes(this.data, 'hex'),
    } as const;
  }

  public toStruct(): any {
    return {
      id: this.id,
      emitter: this.emitter,
      srcNID: this.srcNID,
      dstNID: this.dstNID,
      creator: this.creator,
      destinationAddress: this.destinationAddress,
      token: this.token,
      amount: this.amount,
      toToken: this.toToken,
      toAmount: this.toAmount,
      data: this.data,
    };
  }

  public equals(other: SwapOrder): boolean {
    return (
      this.id === other.id &&
      this.emitter === other.emitter &&
      this.srcNID === other.srcNID &&
      this.dstNID === other.dstNID &&
      this.creator === other.creator &&
      this.destinationAddress === other.destinationAddress &&
      this.token === other.token &&
      this.amount === other.amount &&
      this.toToken === other.toToken &&
      this.toAmount === other.toAmount &&
      this.arrayEquals(this.data, other.data)
    );
  }

  private arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
