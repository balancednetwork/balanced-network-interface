import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
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
    fetchInputData: async () => await bnJs.Rewards.getRecipientsSplit(),
    submit: (account, recipientList) => bnJs.inject({ account }).Rewards.updateBalTokenDistPercentage(recipientList),
  },
  'Network fee allocation': {
    fetchInputData: async () => [
      { recipient_name: 'DAO fund', dist_percent: 45 },
      { recipient_name: 'BALN holders', dist_percent: 55 },
    ],
  },

  'Loan fee': { fetchInputData: async () => [{ dist_percent: 1.15 }] },

  'Collateral ratio': { fetchInputData: async () => [{ dist_percent: 35 }] },

  'Rebalancing threshold': { fetchInputData: async () => [{ dist_percent: 5 }] },
};

interface Touched {
  forumLink: boolean;
  recipient: boolean;
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
  const [recipientInputValue, setRecipientInputValue] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<Touched>({
    forumLink: false,
    recipient: false,
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

  const totalBALN: BigNumber = React.useMemo(() => details['Total balance'] || new BigNumber(0), [details]);
  const stakedBalance: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);
  const minimumStakeBalance = totalBALN.times(0.1);
  const isStakeInvalid = stakedBalance.isLessThan(minimumStakeBalance);

  const isAllocationValid =
    Object.values(recipientInputValue).reduce((sum: number, currentValue: string) => sum + Number(currentValue), 0) ===
    100;

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

  const onRecipientInputChange = (value: string, recipent_name: string) => {
    setRecipientInputValue({ ...recipientInputValue, [recipent_name]: value });
    !touched.recipient && setTouched({ ...touched, recipient: true });
  };

  useEffect(() => setRecipientInputValue({}), [selectedProposalType]);

  const submit = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const recipientList = Object.entries(recipientInputValue).map(item => ({
      recipient_name: item[0] === 'Borrower' ? 'Loans' : item[0],
      dist_percent: BalancedJs.utils.toLoop(item[1]).toString(),
    }));

    PROPOSAL_CONFIG[selectedProposalType]
      .submit(account, recipientList)
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
          {selectedProposalType !== 'Text' && (
            <Ratio
              onRecipientChange={onRecipientInputChange}
              showErrorMessage={touched.recipient && !isAllocationValid}
              value={recipientInputValue}
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
                (selectedProposalType === 'BALN allocation' && !isAllocationValid)
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
