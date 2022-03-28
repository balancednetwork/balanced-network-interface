import React, { useState, useCallback } from 'react';

import { media } from 'btp/src/components/Styles/Media';
import { TransferCard } from 'btp/src/components/TransferCard';
import { useSelect } from 'btp/src/hooks/useRematch';
import { useTokenToUsd } from 'btp/src/hooks/useTokenToUsd';
import { Form } from 'react-final-form';
import styled from 'styled-components/macro';

import { Approval } from './Approval';
import { Details } from './Details';

const Wrapper = styled.div`
  width: 480px;
  text-align: initial;
  overflow: hidden;

  .container {
    display: none;

    &.active {
      display: block;
    }
  }

  ${media.md`
    width: 100%;
  `}
`;

export const TransferBox = () => {
  const [step, setStep] = useState(0);
  const [tokenValue, setTokenValue] = useState('');
  const [sendingInfo, setSendingInfo] = useState({ token: '', network: '' });

  const { isConnected, account } = useSelect(({ account: { selectIsConnected, selectAccountInfo } }) => ({
    isConnected: selectIsConnected,
    account: selectAccountInfo,
  }));

  const isCurrentStep = s => s === step;

  const { unit, currentNetwork } = account;
  const usdRate = useTokenToUsd(sendingInfo.token, 1, isCurrentStep(1));

  const onSendingInfoChange = (info = {}) => {
    setSendingInfo(sendingInfo => ({ ...sendingInfo, ...info }));
  };

  const memoizedSetStep = useCallback(param => setStep(param), [setStep]);
  const memoizedSetTokenValue = useCallback(param => setTokenValue(param), [setTokenValue]);
  const onSubmit = () => {};

  return (
    <Wrapper>
      <Form
        onSubmit={onSubmit}
        render={({ handleSubmit, values, valid, form }) => {
          return (
            <form onSubmit={handleSubmit}>
              <div className={`container ${isCurrentStep(0) && 'active'}`}>
                <TransferCard
                  setStep={memoizedSetStep}
                  setSendingInfo={onSendingInfoChange}
                  isConnected={isConnected}
                  isSendingNativeCoin={unit === sendingInfo.token}
                  currentNetwork={currentNetwork}
                />
              </div>
              <div className={`container ${isCurrentStep(1) && 'active'}`}>
                <Details
                  isCurrent={isCurrentStep(1)}
                  setStep={memoizedSetStep}
                  tokenValue={tokenValue}
                  usdRate={usdRate}
                  setTokenValue={memoizedSetTokenValue}
                  isValidForm={valid}
                  sendingInfo={sendingInfo}
                  account={account}
                  form={form}
                />
              </div>
              <div className={`container ${isCurrentStep(2) && 'active'}`}>
                <Approval
                  isCurrent={isCurrentStep(2)}
                  setStep={memoizedSetStep}
                  values={values}
                  sendingInfo={sendingInfo}
                  account={account}
                  form={form}
                  usdRate={usdRate}
                />
              </div>
            </form>
          );
        }}
      />
    </Wrapper>
  );
};
