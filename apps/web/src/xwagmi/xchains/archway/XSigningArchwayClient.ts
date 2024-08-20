import { Coin, SigningArchwayClient, SigningArchwayClientOptions, StdFee } from '@archwayhq/arch3.js';
import {
  ExecuteInstruction,
  HttpEndpoint,
  JsonObject,
  MsgExecuteContractEncodeObject,
} from '@cosmjs/cosmwasm-stargate';
import { toUtf8 } from '@cosmjs/encoding';
import { EncodeObject, OfflineSigner, Registry } from '@cosmjs/proto-signing';
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

export class XSigningArchwayClient extends SigningArchwayClient {
  protected constructor(
    cometClient: CometClient | undefined,
    signer: OfflineSigner,
    options: SigningArchwayClientOptions,
  ) {
    super(cometClient, signer, options); // Call the parent class's constructor
  }

  public static override async connectWithSigner(
    endpoint: string | HttpEndpoint,
    signer: OfflineSigner,
    options: SigningArchwayClientOptions = {},
  ): Promise<XSigningArchwayClient> {
    const cometClient = await connectComet(endpoint);
    return XSigningArchwayClient.createWithSigner(cometClient, signer, options);
  }

  public static override async createWithSigner(
    cometClient: CometClient,
    signer: OfflineSigner,
    options: SigningArchwayClientOptions = {},
  ): Promise<XSigningArchwayClient> {
    return new XSigningArchwayClient(cometClient, signer, options);
  }

  public override async signAndBroadcastSync(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: number | StdFee | 'auto',
    memo?: string,
  ): Promise<string> {
    let usedFee: StdFee;
    if (fee === 'auto' || typeof fee === 'number') {
      const gasAdjustment = typeof fee === 'number' ? fee : 1.5;

      // @ts-ignore
      usedFee = await this.calculateFee(signerAddress, messages, memo, gasAdjustment);
    } else {
      usedFee = fee;
    }
    return super.signAndBroadcastSync(signerAddress, messages, usedFee, memo);
  }

  public async executeSync(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: StdFee | 'auto' | number,
    memo = '',
    funds?: readonly Coin[],
  ): Promise<any> {
    const instruction: ExecuteInstruction = {
      contractAddress: contractAddress,
      msg: msg,
      funds: funds,
    };

    const msgs: MsgExecuteContractEncodeObject[] = [instruction].map(i => ({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: senderAddress,
        contract: i.contractAddress,
        msg: toUtf8(JSON.stringify(i.msg)),
        funds: [...(i.funds || [])],
      }),
    }));
    const result = await this.signAndBroadcastSync(senderAddress, msgs, fee, memo);
    return result;
  }
}
