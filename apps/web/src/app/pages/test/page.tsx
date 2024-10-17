import { Button } from '@/app/components/Button';
import { tryParseAmount } from '@/store/swap/hooks';
import { getXChainType } from '@/xwagmi/actions';
import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { useXAccount } from '@/xwagmi/hooks';
import { XToken } from '@/xwagmi/types';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import React from 'react';
import { Flex } from 'rebass/styled-components';

const SUI = new XToken('sui', 'sui', NATIVE_ADDRESS, 9, 'SUI', 'SUI');

const addressesMainnet = {
  'Balanced Package Id': '0x52af654cd5f58aaf99638d71fd46896637abff823a9c6e152a297b9832a7ee72',
  'xCall Package Id': '0x3638b141b349173a97261bbfa33ccd45334d41a80584db6f30429e18736206fe',
  'xCall Storage': '0xe9ae3e2d32cdf659ad5db4219b1086cc0b375da5c4f8859c872148895a2eace2',
  'xCall Manager Id': '0xa1fe210d98fb18114455e75f241ab985375dfa27720181268d92fe3499a1111e',
  'xCall Manager Storage': '0x1bbf52529d14124738fac0abc1386670b7927b6d68cab7f9bd998a0c0b274042',
  'Asset Manager Id': '0x1c1795e30fbc0b9c18543527940446e7601f5a3ca4db9830da4f3c68557e1fb3',
  'Asset Manager Storage': '0x25c200a947fd16903d9daea8e4c4b96468cf08d002394b7f1933b636e0a0d500',
  'bnUSD Id': '0xa2d713bd53ccb8855f9d5ac8f174e07450f2ff18e9bbfaa4e17f90f28b919230',
  'bnUSD Storage': '0xd28c9da258f082d5a98556fc08760ec321451216087609acd2ff654d9827c5b5',
};
export function TestPage() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const iconAccount = useXAccount('ICON');
  const suiAccount = useXAccount('SUI');
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const getAllBalances = async () => {
    try {
      // const allBalances = await client.getAllBalances({
      //   owner: suiAccount.address,
      // });
      // console.log('allBalances', allBalances);
      // const res = await client.queryTransactionBlocks({
      //   limit: 1,
      //   options: {
      //     showEvents: true,
      //     showInput: true,
      //   },
      // });
      // console.log('res', res);

      const res = await client.getTransactionBlock({
        digest: '4i4xps7uTEivVUuTyodGHaKwLRJ7UAFmUvEpP1cVY4NV',
        options: {
          showRawInput: true,
          showEffects: true,
        },
      });
      console.log('res', res);
    } catch (error) {}
  };

  const bridge = async (currency: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const currencyAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currency);

      if (!currencyAmount) {
        throw new Error('Invalid amount');
      }

      console.log('currencyAmount', currencyAmount);

      const destination = `0x1.icon/${iconAccount.address}`;
      const xCallFee = {
        rollback: BigInt(1_000_000_000),
      };

      const txb = new Transaction();

      // txb.setGasBudget(100_000_000);

      const [depositCoin, feeCoin] = txb.splitCoins(txb.gas, [8_000_000, 1_000_000_000]);

      txb.moveCall({
        target: `${addressesMainnet['Balanced Package Id']}::asset_manager::deposit`,
        arguments: [
          txb.object(addressesMainnet['Asset Manager Storage']),
          txb.object(addressesMainnet['xCall Storage']),
          txb.object(addressesMainnet['xCall Manager Storage']),
          feeCoin,
          depositCoin,
          txb.pure(bcs.vector(bcs.string()).serialize([destination])),
          txb.pure(bcs.vector(bcs.string()).serialize(['0x'])),
        ],
        typeArguments: ['0x2::sui::SUI'],
      });

      const { bytes, signature, reportTransactionEffects } = await signTransaction({
        transaction: txb,
      });

      const executeResult = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
        },
      });
    } catch (error) {
      console.error('error', error);
    }
    setIsProcessing(false);
  };
  const handleBridgeSUIFromSuiToIcon = async () => {
    console.log('handleBridgeSUIFromSuiToIcon');
    // await bridge(SUI, '1');
    // await getFee();
    await getAllBalances();
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleBridgeSUIFromSuiToIcon} disabled={isProcessing}>
          Bridge SUI from Icon to SUI
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
