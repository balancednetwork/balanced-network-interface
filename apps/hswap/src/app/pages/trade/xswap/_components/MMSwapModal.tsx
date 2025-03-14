import React, { useCallback, useEffect, useState } from 'react';

import {
  EvmXService,
  XToken,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useXService,
  xChainMap,
} from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { CreateIntentOrderPayload, EvmProvider, SolverApiService, SuiProvider } from 'icon-intents-sdk';
import { CheckIcon } from 'lucide-react';
import { WriteContractErrorType } from 'viem';

import { WhiteButton } from '@/app/components/Button';
import { ArrowGradientIcon } from '@/app/components/Icons';
import { Modal } from '@/app/components/Modal';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { intentService, intentServiceConfig } from '@/lib/intent';
import { MMTrade } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import {
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useMMTransactionStore';
import { formatBigNumber } from '@/utils';
import CurrencyCard from './CurrencyCard';

type MMSwapModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  currencies: { [field in Field]?: XToken | undefined };
  trade?: MMTrade;
  recipient?: string | null;
};

enum IntentOrderStatus {
  None,
  // Intent order is signed and broadcasted to the source chain
  SigningAndCreating,
  // Intent order is created on the source chain and waiting for execution.
  Executing,
  // Intent order is filled on the target chain.
  Filled,
  //
  Failure,
}

const MMSwapModal = ({
  modalId = MODAL_ID.MM_SWAP_CONFIRM_MODAL,
  account,
  currencies,
  trade,
  recipient,
}: MMSwapModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);
  const [error, setError] = useState<string | null>(null);

  const currentMMTransaction = useMMTransactionStore(state => state.get(intentId));

  useEffect(() => {
    if (currentMMTransaction) {
      currentMMTransaction.status === MMTransactionStatus.success && setOrderStatus(IntentOrderStatus.Filled);
      currentMMTransaction.status === MMTransactionStatus.failure && setOrderStatus(IntentOrderStatus.Failure);
    }
  }, [currentMMTransaction]);

  const isFilled = orderStatus === IntentOrderStatus.Filled;

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setIntentId(null);
      setOrderStatus(IntentOrderStatus.None);
      setError(null);
    }, 500);
  }, [modalId]);

  //to show success or fail message in the modal
  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (isFilled) {
      slowDismiss();
    }
  }, [isFilled, slowDismiss]);

  // arb part
  const xService = useXService('EVM') as unknown as EvmXService;
  // end arb part

  // sui part
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  // end sui part

  const { approvalState, approveCallback } = useApproveCallback(
    trade?.inputAmount,
    trade?.inputAmount.currency.xChainId === '0xa4b1.arbitrum'
      ? intentService.getChainConfig('arb').intentContract
      : // sui doesn't need approval. '0x' is a dummy address to pass the check
        '0x',
  );

  const handleMMSwap = async () => {
    if (!account || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT] || !trade) {
      return;
    }
    setOrderStatus(IntentOrderStatus.SigningAndCreating);
    const walletClient = await xService.getWalletClient(xChainMap[currencies[Field.INPUT]?.chainId]);
    const publicClient = xService.getPublicClient(xChainMap[currencies[Field.INPUT]?.chainId]);

    const order: CreateIntentOrderPayload = {
      quote_uuid: trade.uuid,
      fromAddress: account, // address we are sending funds from (fromChain)
      toAddress: recipient, // destination address where funds are transfered to (toChain)
      // fromChain: currencies[Field.INPUT]?.xChainId, // ChainName
      // toChain: currencies[Field.OUTPUT]?.xChainId, // ChainName
      fromChain: currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum' ? 'arb' : 'sui',
      toChain: currencies[Field.OUTPUT].xChainId === 'sui' ? 'sui' : 'arb',
      token: currencies[Field.INPUT]?.address,
      toToken: currencies[Field.OUTPUT]?.address,
      amount: trade.inputAmount.quotient,
      toAmount: trade.outputAmount.quotient,
    };
    try {
      const provider =
        currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum'
          ? // @ts-ignore
            new EvmProvider({ walletClient: walletClient, publicClient: publicClient })
          : // @ts-ignore
            new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount });

      const intentHash = await intentService.createIntentOrder(order, provider);

      setOrderStatus(IntentOrderStatus.Executing);

      if (!intentHash.ok) {
        const e = intentHash.error as WriteContractErrorType;

        if (e.name === 'ContractFunctionExecutionError' && e.details === 'User rejected the request.') {
          setOrderStatus(IntentOrderStatus.None);
          return;
        }

        // @ts-ignore
        setError(intentHash?.error?.shortMessage || 'Error creating intent order');
        setOrderStatus(IntentOrderStatus.Failure);
        return;
      }

      const intentResult = await intentService.getOrder(
        intentHash.value,
        currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum' ? 'arb' : 'sui',
        provider,
      );

      if (!intentResult.ok) {
        return;
      }

      MMTransactionActions.add({
        id: intentHash.value,
        executor: account,
        status: MMTransactionStatus.pending,
        fromAmount: trade.inputAmount,
        toAmount: trade.outputAmount,
        orderId: BigInt(intentResult.value.id),
        taskId: '',
        createdAt: Date.now(),
      });
      setIntentId(intentHash.value);

      const executionResult = await SolverApiService.postExecution(
        {
          intent_tx_hash: intentHash.value,
          quote_uuid: trade.uuid,
        },
        intentServiceConfig,
      );

      if (executionResult.ok) {
        MMTransactionActions.setTaskId(intentHash.value, executionResult.value.task_id);
      } else {
        setError(executionResult.error?.detail?.message);
        console.error('IntentService.executeIntentOrder error', executionResult.error);
        setOrderStatus(IntentOrderStatus.Failure);
      }
    } catch (e) {
      setOrderStatus(IntentOrderStatus.None);
      console.error('SwapMMCommitButton error', e);
    }
  };

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon',
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };
  const gasChecker = useXCallGasChecker(trade?.inputAmount);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  const isProcessing = orderStatus === IntentOrderStatus.Executing;

  const [inputAmount, outputAmount] = [trade?.inputAmount, trade?.outputAmount];
  const executionTrade = trade;

  return (
    <Modal
      open={modalOpen}
      onDismiss={handleDismiss}
      title={''}
      className="bg-[#D4C5F9]/30 backdrop-blur-[50px] border-none px-10"
      dialogClassName="max-w-[350px] h-[625px] pt-[120px]"
    >
      <div className="flex flex-col gap-8">
        <div className="relative flex justify-center gap-2">
          <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={inputAmount} />
          <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={outputAmount} />
          <div className="bg-title-gradient absolute top-[50%] left-[50%] mx-[-16px] my-[-32px] w-8 h-8 p-1 rounded-full">
            <div className="bg-white flex justify-center items-center rounded-full w-full h-full">
              <ArrowGradientIcon />
            </div>
          </div>
        </div>

        {/* Details section displays rate, fees, network cost, etc. w/ additional details in drop-down menu .*/}
        {
          <>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[#d4c5f9] text-sm font-medium">Rate</span>
                <span className="text-white text-sm">
                  1 {executionTrade?.executionPrice.baseCurrency.symbol} ={' '}
                  {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                    executionTrade?.executionPrice.quoteCurrency.symbol
                  }`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#d4c5f9] text-sm font-medium">Swap Fee</span>
                <span className="text-white text-sm">
                  {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
                  {currencies[Field.INPUT]?.symbol}
                </span>
              </div>
            </div>
          </>
        }

        {orderStatus === IntentOrderStatus.Failure && <div className="text-red-500 text-center">Swap failed</div>}

        {orderStatus !== IntentOrderStatus.Filled &&
          orderStatus !== IntentOrderStatus.Failure &&
          (isWrongChain ? (
            <WhiteButton onClick={handleSwitchChain} className="h-[48px] text-base rounded-full">
              <Trans>Switch to {xChainMap[direction.from].name}</Trans>
              <ArrowGradientIcon />
            </WhiteButton>
          ) : isProcessing ? (
            <WhiteButton className="h-[48px] text-base rounded-full">
              <Trans>Swapping</Trans>
              <ArrowGradientIcon />
            </WhiteButton>
          ) : (
            <>
              {approvalState !== ApprovalState.APPROVED ? (
                <WhiteButton
                  onClick={approveCallback}
                  className="h-[48px] text-base rounded-full"
                  disabled={approvalState === ApprovalState.PENDING}
                >
                  {approvalState === ApprovalState.PENDING ? <Trans>Approving</Trans> : <Trans>Approve</Trans>}
                  <ArrowGradientIcon />
                </WhiteButton>
              ) : (
                <WhiteButton onClick={handleMMSwap} className="h-[48px] text-base rounded-full">
                  <Trans>Swap</Trans>
                  <ArrowGradientIcon />
                </WhiteButton>
              )}
            </>
          ))}

        {orderStatus === IntentOrderStatus.Filled && (
          <div className="flex flex-col gap-2 justify-center items-center">
            <div className="bg-[#e6e0f7] w-[40px] h-[40px] rounded-full flex items-center justify-center">
              <div className="bg-title-gradient rounded-full w-4 h-4 flex justify-center items-center">
                <CheckIcon className="w-2 h-2" />
              </div>
            </div>
            <div className=" text-[#e6e0f7] text-sm font-bold">Swap completed!</div>
          </div>
        )}

        {orderStatus === IntentOrderStatus.None && !gasChecker.hasEnoughGas && (
          <div className="text-red-500 text-center">{gasChecker.errorMessage}</div>
        )}
      </div>
    </Modal>
  );
};

export default MMSwapModal;
