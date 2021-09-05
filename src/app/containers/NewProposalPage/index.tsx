import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import { DefaultLayout } from 'app/components/Layout';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import ProposalTypesSelect from 'app/components/newproposal/ProposalTypesSelect';
import Ratio from 'app/components/newproposal/Ratio';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { usePlatformDayQuery } from 'queries/vote';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useProposalType } from 'store/proposal/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX, useWalletFetchBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

const NewProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const ProposalDetailContainer = styled(Box)`
  margin-top: 30px;
  border-radius: 10px;
  padding: 35px 35px;
  margin-bottom: 50px;
  background-color: ${({ theme }) => theme.colors.bg2};
`;

const FieldContainer = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FieldInput = styled.input`
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: 10px;
  width: 100%;
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 20px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
`;

const FieldTextArea = styled.textarea`
  margin-top: 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  width: 100%;
  min-height: 150px;
  border: none;
  caret-color: white;
  color: white;
  padding: 15px 20px;
  font-family: tex-gyre-adventor, Arial, sans-serif;
  font-size: 16px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
    transition: border 0.2s ease;
  }
`;

export const PROPOSAL_CONFIG = {
  Text: undefined,
  'BALN allocation': {
    fetchInputData: async () =>
      Object.entries(await bnJs.Rewards.getRecipientsSplit()).map(item => ({
        name: item[0] === 'Loans' ? 'Borrower' : item[0],
        percent: BalancedJs.utils
          .toIcx(item[1] as string)
          .times(100)
          .toFixed(),
      })),
    submitParams: ratioInputValue => {
      const recipientList = Object.entries(ratioInputValue).map(item => ({
        recipient_name: item[0] === 'Borrower' ? 'Loans' : item[0],
        dist_percent: BalancedJs.utils.toLoop(Number(item[1]) / 100).toNumber(),
      }));
      return {
        updateDistPercent: { _recipient_list: recipientList },
      };
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },
  'Network fee allocation': {
    fetchInputData: async () => {
      const res = await bnJs.Dividends.getDividendsPercentage();
      return Object.entries(res).map(item => ({
        name: item[0] === 'daofund' ? 'DAO fund' : 'BALN holders',
        percent: BalancedJs.utils
          .toIcx(item[1] as string)
          .times(100)
          .toFixed(),
      }));
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },

  'Loan fee': {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = Number((parseInt(res['origination fee'], 16) / 100).toFixed(2));
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const origination_fee = Number(Object.values(ratioInputValue)) * 100;
      return { update_origination_fee: { _fee: origination_fee } };
    },
    validate: sum => ({
      isValid: sum <= 10,
      message: 'Must be less than or equal to 10%.',
    }),
  },

  'Loan to value ratio': {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = Number((1000000 / parseInt(res['locking ratio'], 16) / 10000).toFixed(2));
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const locking_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return { update_locking_ratio: { _ratio: locking_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 80,
      message: 'Must be less than or equal to the liquidation threshold (80%).',
    }),
  },

  'Rebalancing threshold': {
    fetchInputData: async () => {
      const res = await bnJs.Rebalancing.getPriceChangeThreshold();
      const _percent = BalancedJs.utils.toIcx(res).times(100).toFixed();
      return [{ percent: _percent }];
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
};

interface Touched {
  forumLink: boolean;
  ratio: boolean;
}

export function NewProposalPage() {
  const theme = useTheme();
  const details = useBALNDetails();
  const { account } = useIconReact();
  useWalletFetchBalances(account);
  const selectedProposalType = useProposalType();

  //Form
  const [title, setTitle] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [description, setDescription] = useState('');
  const [ratioInputValue, setRatioInputValue] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<Touched>({
    forumLink: false,
    ratio: false,
  });

  // modal
  const [open, setOpen] = React.useState(false);
  const hasEnoughICX = useHasEnoughICX();

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
    changeShouldLedgerSign(false);
  };

  const addTransaction = useTransactionAdder();

  //Form
  const isTextProposal = selectedProposalType === 'Text';
  const totalBALN: BigNumber = React.useMemo(() => details['Total balance'] || new BigNumber(0), [details]);
  const stakedBalance: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);
  const minimumStakeBalance = totalBALN.times(0.1 / 100);
  const isStakeInvalid = stakedBalance.isLessThan(minimumStakeBalance);

  const { data: platformDay } = usePlatformDayQuery();

  const totalRatio = Object.values(ratioInputValue).reduce(
    (sum: number, currentValue: string) => sum + Number(currentValue),
    0,
  );
  const { submitParams, validate } = !isTextProposal && PROPOSAL_CONFIG[selectedProposalType];

  const { isValid, message } = !!validate && validate(totalRatio);

  // Will remove when forumLink is used in later sprints
  console.log(forumLink);

  const onTitleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle(event.currentTarget.value);
  };

  const onForumInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setForumLink(event.currentTarget.value);
    !touched.forumLink && setTouched({ ...touched, forumLink: true });
  };

  const onTextAreaInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setDescription(event.currentTarget.value);
  };

  const onRatioInputChange = (value: string, recipent_name: string) => {
    setRatioInputValue({ ...ratioInputValue, [recipent_name]: value });
    !touched.ratio && setTouched({ ...touched, ratio: true });
  };

  useEffect(() => setRatioInputValue({}), [selectedProposalType]);

  const submit = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const actions = isTextProposal ? '' : JSON.stringify(submitParams(ratioInputValue));

    platformDay &&
      bnJs
        .inject({ account })
        .Governance.defineVote(
          title,
          description,
          IconConverter.toHex(platformDay + 1),
          IconConverter.toHex(platformDay),
          actions,
        )
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Voting BALN tokens...',
                summary: `Voted BALN tokens.`,
              },
            );
            toggleOpen();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
  };

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <NewProposalContainer>
        <Breadcrumb title={'New proposal'} locationText={'Vote'} locationPath={'/vote'} />
        <ProposalTypesSelect />
        <ProposalDetailContainer>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Title
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${title.length}/100`}
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onTitleInputChange} />
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Forum link
            </Typography>
          </FieldContainer>
          <Tooltip
            containerStyle={{ width: 'auto' }}
            refStyle={{ display: 'block' }}
            placement="bottom"
            text="Must link to a discussion on gov.balanced.network."
            show={touched.forumLink && !forumLink.includes('gov.balanced.network')}
          >
            <FieldInput type="text" onChange={onForumInputChange} />
          </Tooltip>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Description
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${description.length}/500`}
            </Typography>
          </FieldContainer>
          {/* @ts-ignore */}
          <FieldTextArea onChange={onTextAreaInputChange} />
          {!isTextProposal && (
            <Ratio
              onRatioChange={onRatioInputChange}
              showErrorMessage={touched.ratio && !isValid}
              value={ratioInputValue}
              message={message}
            />
          )}

          <Typography variant="content" mt="25px" mb="25px" textAlign="center">
            It costs 100 bnUSD to submit a proposal.
          </Typography>
          <div style={{ textAlign: 'center' }}>
            <Button
              disabled={
                description.length > 500 ||
                title.length > 100 ||
                !account ||
                isStakeInvalid ||
                (!isTextProposal && !isValid)
              }
              onClick={toggleOpen}
            >
              Submit
            </Button>
          </div>
          {account && isStakeInvalid && (
            <Typography variant="content" mt="25px" mb="25px" textAlign="center" color={theme.colors.alert}>
              Stake at least {minimumStakeBalance.dp(2).toFormat()} BALN if you want to propose a change.
            </Typography>
          )}
        </ProposalDetailContainer>
      </NewProposalContainer>
      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Submit proposal?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            100 bnUSD
          </Typography>

          <Typography textAlign="center" marginTop="10px">
            Voting will begin at 5pm UTC,
            <br />
            and ends after 5 days.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner />}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Go back
                </TextButton>
                <Button onClick={submit} fontSize={14} disabled={!hasEnoughICX}>
                  Submit proposal
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </DefaultLayout>
  );
}
