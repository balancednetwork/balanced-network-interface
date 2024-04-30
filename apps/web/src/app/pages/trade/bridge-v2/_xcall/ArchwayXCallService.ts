import { StdFee } from '@archwayhq/arch3.js';

import { archway, xChainMap } from 'app/_xcall/archway/config1';
import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';

import { bridgeTransferActions } from '../_zustand/useBridgeTransferStore';
import { transactionActions } from '../_zustand/useTransactionStore';
import { XCallEventType, XChainId } from 'app/_xcall/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ArchwayXCallService {
  client: any;
  signedClient: any;
  xChainId: any;

  constructor(xChainId, client, signedClient) {
    this.xChainId = xChainId;
    this.client = client;
    this.signedClient = signedClient;
  }

  async fetchXCallFee(to: XChainId, rollback: boolean) {
    return await this.client.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: xChainMap[to].xChainId, rollback },
    });
  }

  async fetchBlockHeight() {
    const height = await this.client.getHeight();
    return height;
  }

  async fetchSourceEvents(transfer) {
    //TODO: implement this
    console.log('fetchSourceEvents executed');
    return {};
  }

  async fetchDestinationEvents(transfer) {
    //TODO: implement this
    console.log('fetchDestinationEvents executed');

    await delay(3000);
    return {
      [XCallEventType.CallMessage]: {
        hash: '0x1234',
        blockHeight: 1234,
        blockHash: '0x1234',
        eventLogs: [],
      },
      [XCallEventType.CallExecuted]: {
        hash: '0x1234',
        blockHeight: 1234,
        blockHash: '0x1234',
        eventLogs: [],
      },
    };

    // return {};
  }

  async executeTransfer(bridgeInfo) {
    const {
      bridgeDirection,
      currencyAmountToBridge,
      recipient: destinationAddress,
      account,
      xCallFee,
      isLiquidFinanceEnabled,
      isDenom,
    } = bridgeInfo;

    if (this.signedClient) {
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          // initTransaction(bridgeDirection.from, `Requesting cross-chain transfer...`);
          bridgeTransferActions.setIsTransferring(true);

          const res = await this.signedClient.execute(
            account,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== '0'
              ? [
                  { amount: xCallFee.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          // const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          // addTransactionResult(bridgeDirection.from, res, t`Cross-chain transfer requested.`);
          // originEventData && addOriginEvent(bridgeDirection.from, originEventData);
        } catch (e) {
          console.error(e);
          // addTransactionResult(bridgeDirection.from, null, 'Cross-chain transfer request failed');
          bridgeTransferActions.setIsTransferring(false);
        }
      };

      if (isDenom) {
        const msg = { deposit_denom: { denom: tokenAddress, to: destination, data: [] } };
        const assetToBridge = {
          denom: tokenAddress,
          amount: `${currencyAmountToBridge.quotient}`,
        };

        executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000), assetToBridge);
      } else {
        if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          const msg = {
            cross_transfer: {
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          executeTransaction(msg, tokenAddress, 'auto');
        } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000));
        }
      }
    }
  }
}
