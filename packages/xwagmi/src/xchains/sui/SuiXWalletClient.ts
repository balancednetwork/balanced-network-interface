import { ICON_XCALL_NETWORK_ID, xTokenMap } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, sui } from '@/constants/xChains';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { RLP } from '@ethereumjs/rlp';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { signTransaction } from '@mysten/wallet-standard';
import { toBytes, toHex } from 'viem';
import { XTransactionInput } from '../../xcall/types';
import bnJs from '../icon/bnJs';
import { SuiXService } from './SuiXService';

const addressesMainnet = {
  'Balanced Package Id': '0x8da1235b26117a06aeef07d97ee0e55ab2641c553d029edd3d11d85feed626d4',
  'xCall Package Id': '0x3e3424f015ae28e9c223ce5828e70746d4174024e087b42576cb6ea837ee9cd7',
  'xCall Storage': '0xe9ae3e2d32cdf659ad5db4219b1086cc0b375da5c4f8859c872148895a2eace2',
  'xCall Manager Id': '0xa1fe210d98fb18114455e75f241ab985375dfa27720181268d92fe3499a1111e',
  'xCall Manager Storage': '0x1bbf52529d14124738fac0abc1386670b7927b6d68cab7f9bd998a0c0b274042',
  'Asset Manager Id': '0x1c1795e30fbc0b9c18543527940446e7601f5a3ca4db9830da4f3c68557e1fb3',
  'Asset Manager Storage': '0x25c200a947fd16903d9daea8e4c4b96468cf08d002394b7f1933b636e0a0d500',
  'bnUSD Id': '0xa2d713bd53ccb8855f9d5ac8f174e07450f2ff18e9bbfaa4e17f90f28b919230',
  'bnUSD Storage': '0xd28c9da258f082d5a98556fc08760ec321451216087609acd2ff654d9827c5b5',
};

const TokenModuleMap = {
  bnUSD: {
    packageId: '0x64f781b9718f889c62f66ea934050de4b785f200ae8ac44e85efdd990150afe1',
    name: 'balanced_dollar_crosschain',
    storage: '0xd28c9da258f082d5a98556fc08760ec321451216087609acd2ff654d9827c5b5',
  },
  sICX: {
    packageId: '0x5f759a134845f23cf898ae9eaaa9a39b38384a95f96e11ebaf656aafdc946322',
    name: 'sicx_crosschain',
    storage: '0x7dbf97c738741bc26fa62b1eb8fc18e5d39f551337261d45b7d75c21186fada1',
  },
  BALN: {
    packageId: '0x5f759a134845f23cf898ae9eaaa9a39b38384a95f96e11ebaf656aafdc946322',
    name: 'balanced_token_crosschain',
    storage: '0x1c2bdf16b54bf2f51b4861e3b987ed8d50b5321e775682ab001e7cb0a27e57ca',
  },
};

const XCALL_FEE_AMOUNT = BigInt(sui.gasThreshold * 10 ** sui.nativeCurrency.decimals);

export class SuiXWalletClient extends XWalletClient {
  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _signAndExecuteTransactionBlock(txb: Transaction): Promise<string | undefined> {
    const { bytes, signature } = await signTransaction(this.getXService().suiWallet, {
      transaction: txb,
      account: this.getXService().suiAccount,
      chain: this.getXService().suiAccount.chains[0],
    });

    const txResult = await this.getXService().suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: {
        showRawEffects: true,
      },
    });

    const { digest: hash } = txResult || {};
    return hash;
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const amount = BigInt(inputAmount.quotient.toString());

    const coinType = inputAmount.currency.isNativeToken ? '0x2::sui::SUI' : inputAmount.currency.address;

    const txb = new Transaction();
    let depositCoin, feeCoin;

    if (inputAmount.currency.isNativeToken) {
      [depositCoin, feeCoin] = txb.splitCoins(txb.gas, [amount, XCALL_FEE_AMOUNT]);
    } else {
      const coins = (
        await this.getXService().suiClient.getCoins({
          owner: account,
          coinType,
        })
      )?.data;
      if (!coins || coins.length === 0) {
        throw new Error('No coins found');
      } else if (coins.length > 1) {
        await txb.mergeCoins(
          coins[0].coinObjectId,
          coins.slice(1).map(coin => coin.coinObjectId),
        );
      }

      [depositCoin] = txb.splitCoins(coins[0].coinObjectId, [amount]);
      [feeCoin] = txb.splitCoins(txb.gas, [XCALL_FEE_AMOUNT]);
    }

    txb.moveCall({
      target: `${addressesMainnet['Balanced Package Id']}::asset_manager::deposit`,
      arguments: [
        txb.object(addressesMainnet['Asset Manager Storage']),
        txb.object(addressesMainnet['xCall Storage']),
        txb.object(addressesMainnet['xCall Manager Storage']),
        feeCoin,
        depositCoin,
        txb.pure(bcs.vector(bcs.string()).serialize([destination])),
        txb.pure(bcs.vector(bcs.vector(bcs.u8())).serialize([data])),
      ],
      typeArguments: [coinType],
    });

    return await this._signAndExecuteTransactionBlock(txb);
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const amount = BigInt(inputAmount.quotient.toString());

    const coinType = inputAmount.currency.address;

    const coins = (
      await this.getXService().suiClient.getCoins({
        owner: account,
        coinType,
      })
    )?.data;

    const txb = new Transaction();

    if (!coins || coins.length === 0) {
      throw new Error('No coins found');
    } else if (coins.length > 1) {
      await txb.mergeCoins(
        coins[0].coinObjectId,
        coins.slice(1).map(coin => coin.coinObjectId),
      );
    }

    const [depositCoin] = txb.splitCoins(coins[0].coinObjectId, [amount]);
    const [feeCoin] = txb.splitCoins(txb.gas, [XCALL_FEE_AMOUNT]);

    txb.moveCall({
      target: `${TokenModuleMap[inputAmount.currency.symbol].packageId}::${TokenModuleMap[inputAmount.currency.symbol].name}::cross_transfer`,
      arguments: [
        txb.object(TokenModuleMap[inputAmount.currency.symbol].storage),
        txb.object(addressesMainnet['xCall Storage']),
        txb.object(addressesMainnet['xCall Manager Storage']),
        feeCoin,
        depositCoin,
        txb.pure(bcs.string().serialize(destination)),
        txb.pure(bcs.vector(bcs.vector(bcs.u8())).serialize([data])),
      ],
      // typeArguments: [],
    });

    return await this._signAndExecuteTransactionBlock(txb);
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const envelope = toBytes(
      toHex(
        RLP.encode([
          Buffer.from([0]),
          toHex(data),
          FROM_SOURCES[sourceChainId]?.map(Buffer.from),
          TO_SOURCES[sourceChainId]?.map(Buffer.from),
        ]),
      ),
    );

    const txb = new Transaction();
    const [feeCoin] = txb.splitCoins(txb.gas, [XCALL_FEE_AMOUNT]);
    txb.moveCall({
      target: `${addressesMainnet['xCall Package Id']}::main::send_call_ua`,
      arguments: [
        txb.object(addressesMainnet['xCall Storage']),
        feeCoin,
        txb.pure(bcs.string().serialize(destination)),
        txb.pure(bcs.vector(bcs.u8()).serialize(envelope)),
      ],
    });

    return await this._signAndExecuteTransactionBlock(txb);
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const bnUSD = xTokenMap['sui'].find(token => token.symbol === 'bnUSD');
    if (!bnUSD) {
      throw new Error('bnUSD XToken not found');
    }

    const iconBnUSDAmount = BigInt(inputAmount.multiply(-1).quotient.toString());

    const amount = BigInt(Math.ceil(-1 * Number(inputAmount.toFixed()) * 10 ** bnUSD.decimals));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toBytes(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const txb = new Transaction();

    const coins = (
      await this.getXService().suiClient.getCoins({
        owner: account,
        coinType: bnUSD.address,
      })
    )?.data;
    if (!coins || coins.length === 0) {
      throw new Error('No coins found');
    } else if (coins.length > 1) {
      await txb.mergeCoins(
        coins[0].coinObjectId,
        coins.slice(1).map(coin => coin.coinObjectId),
      );
    }
    const bnUSDTotalAmount = coins.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));

    const [depositCoin] = txb.splitCoins(coins[0].coinObjectId, [
      amount < bnUSDTotalAmount ? amount : bnUSDTotalAmount,
    ]);
    const [feeCoin] = txb.splitCoins(txb.gas, [XCALL_FEE_AMOUNT]);

    txb.moveCall({
      target: `${addressesMainnet['Balanced Package Id']}::balanced_dollar_crosschain::cross_transfer_exact`,
      arguments: [
        txb.object(addressesMainnet['bnUSD Storage']),
        txb.object(addressesMainnet['xCall Storage']),
        txb.object(addressesMainnet['xCall Manager Storage']),
        feeCoin,
        depositCoin,
        txb.pure(bcs.u128().serialize(iconBnUSDAmount)),
        txb.pure(bcs.string().serialize(destination)),
        txb.pure(bcs.vector(bcs.vector(bcs.u8())).serialize([data])),
      ],
      // typeArguments: [],
    });

    return await this._signAndExecuteTransactionBlock(txb);
  }
}

// TODO: toBytes vs toHex?
