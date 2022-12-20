import React, { memo } from 'react';

import binanceIcon from 'btp/src/assets/images/binance-icon.svg';
import ethIcon from 'btp/src/assets/images/eth-icon.svg';
import hanaIcon from 'btp/src/assets/images/hana-wallet.png';
import iconexIcon from 'btp/src/assets/images/icon-ex.svg';
import metaMaskIcon from 'btp/src/assets/images/metal-mask.svg';
import moonbeamIcon from 'btp/src/assets/images/moonbeam.jpeg';
import nearIcon from 'btp/src/assets/images/near-icon.svg';
import { Icon } from 'btp/src/components/Icon';
import { TokenInput, TextInput } from 'btp/src/components/Input';
import { colors } from 'btp/src/components/Styles/Colors';
import { media } from 'btp/src/components/Styles/Media';
import { Header, Text } from 'btp/src/components/Typography';
import { useTokenBalance } from 'btp/src/hooks/useTokenBalance';
import { toSeparatedNumberString } from 'btp/src/utils/app';
import { wallets } from 'btp/src/utils/constants';
import { composeValidators, maxValue } from 'btp/src/utils/inputValidation';
import PropTypes from 'prop-types';
import { Field } from 'react-final-form';
import styled from 'styled-components/macro';

import { ControlButtons } from './ControlButtons';

const Wrapper = styled.div`
  padding-top: 23px;

  .heading {
    text-align: center;
    margin-bottom: 28px;
  }

  .content {
    margin-top: 10px;
    padding: 0 32px;

    .label {
      margin: 27px 0 7px;
    }
  }
`;

const WalletBalance = styled.div`
  width: 100%;
  height: 64px;

  border: solid 1px ${colors.grayLine};
  border-radius: 4px;

  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  margin-bottom: 32px;

  .left {
    display: flex;
    align-items: center;

    .wallet-name {
      margin-left: 13.17px;
      text-transform: capitalize;
    }
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }

  ${media.md`
    padding: 16px;
    flex-direction: column;
    align-items: center;
    height: auto;

    .right {
      margin-top: 16px;
      align-items: center
    }
  `}
`;

const Addresses = styled.div`
  padding: 18px 32px;
  border-top: solid 1px ${colors.grayLine};
  border-bottom: solid 1px ${colors.grayLine};

  .send {
    margin-bottom: 12px;
  }

  .send,
  .to {
    display: flex;
    justify-content: space-between;

    .sender {
      display: flex;
      align-items: center;

      .sender--name {
        margin-left: 8px;
      }
    }
  }
`;

const required = value => (value ? undefined : 'Required');
const fields = {
  tokenAmount: 'tokenAmount',
  recipient: 'recipient',
};

export const icons = {
  [wallets.iconex]: iconexIcon,
  ICX: iconexIcon,
  [wallets.metamask]: metaMaskIcon,
  DEV: moonbeamIcon,
  [wallets.hana]: hanaIcon,
  BNB: binanceIcon,
  ETH: ethIcon,
  // NEAR: nearIcon,
};

export const Details = memo(
  ({ setStep, setTokenValue, isValidForm, isCurrent, sendingInfo, account, usdRate, form }) => {
    const { token, network } = sendingInfo;
    const { balance, currentNetwork, wallet } = account;
    const [currentBalance] = useTokenBalance(token);

    const max = maxValue(currentBalance, 'Insufficient balance');

    return (
      <Wrapper>
        <Header className="sm bold heading">Transfer</Header>
        <Field
          name={fields.tokenAmount}
          validate={composeValidators(required, max)}
          render={({ input, meta }) => (
            <TokenInput
              placeholder={`0 ${token}`}
              setTokenValue={setTokenValue}
              isCurrent={isCurrent}
              token={token}
              usdRate={usdRate}
              {...input}
              meta={meta}
            />
          )}
        />

        <div className="content">
          <Text className="sm label">Recipient</Text>

          <Field
            name={fields.recipient}
            validate={required}
            render={({ input, meta }) => (
              <TextInput placeholder={`Enter a ${network} address`} {...input} meta={meta} />
            )}
          />

          <Text className="sm label">Wallet balance</Text>
          <WalletBalance>
            <div className="left">
              <Icon iconURL={icons[wallet]} />
              <Text className="md wallet-name">{wallet}</Text>
            </div>
            <div className="right">
              <Text className="md">
                {toSeparatedNumberString(currentBalance)} {token}
              </Text>
              <Text className="xs" color={colors.graySubText}>
                = ${toSeparatedNumberString(usdRate * balance)}
              </Text>
            </div>
          </WalletBalance>
        </div>

        <Addresses>
          <div className="send">
            <Text className="md" color={colors.graySubText}>
              Send
            </Text>
            <div className="sender">
              <Icon iconURL={icons[token]} size="s" />
              <Text className="md sender--name">
                {token} ({currentNetwork})
              </Text>
            </div>
          </div>
          <div className="to">
            <Text className="md" color={colors.graySubText}>
              To
            </Text>
            <Text className="md">{network}</Text>
          </div>
        </Addresses>
        <ControlButtons
          onExecute={() => {
            if (isValidForm) setStep(2);
          }}
          onBack={() => {
            form.resetFieldState(fields.tokenAmount);
            form.resetFieldState(fields.recipient);
            setStep(0);
          }}
          disabled={currentBalance === null}
        />
      </Wrapper>
    );
  },
);

Details.displayName = 'Details';

Details.propTypes = {
  /** Set step for transfer box */
  setStep: PropTypes.func,
  /** Set token input value */
  setTokenValue: PropTypes.func,
  isValidForm: PropTypes.bool,
  /** Is the current display screen */
  isCurrent: PropTypes.bool,
  sendingInfo: PropTypes.shape({
    token: PropTypes.string,
    network: PropTypes.string,
  }),
  account: PropTypes.shape({
    balance: PropTypes.number,
    currentNetwork: PropTypes.string,
    wallet: PropTypes.string,
  }),
  /** Token in USD rate */
  usdRate: PropTypes.number,
  /** react-final-form object */
  form: PropTypes.object,
};
