import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
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
import RatioInput from 'app/components/newproposal/RatioInput';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { PROPOSAL_CONFIG, PROPOSAL_TYPE } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { usePlatformDayQuery } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX, useWalletFetchBalances } from 'store/wallet/hooks';
import { CurrencyAmount } from 'types/balanced-sdk-core';
import { showMessageOnBeforeUnload } from 'utils/messages';

import FundingInput, { CurrencyValue } from '../../components/newproposal/FundingInput';

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

interface ErrorItem {
  forumLink: boolean;
  ratio: boolean;
}

export function NewProposalPage() {
  const theme = useTheme();
  const details = useBALNDetails();
  const { account } = useIconReact();
  useWalletFetchBalances(account);
  const [selectedProposalType, setProposalType] = React.useState<PROPOSAL_TYPE>(PROPOSAL_TYPE.TEXT);

  //Form
  const [title, setTitle] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [description, setDescription] = useState('');
  const [ratioInputValue, setRatioInputValue] = useState<{ [key: string]: string }>({});
  const [currencyInputValue, setCurrencyInputValue] = React.useState<CurrencyValue>({
    recipient: '',
    amounts: [{ item: CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_LIST[0], 0) }],
  });

  const [showError, setShowError] = useState<ErrorItem>({
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
  const isTextProposal = selectedProposalType === PROPOSAL_TYPE.TEXT;
  const isFundingProposal = selectedProposalType === PROPOSAL_TYPE.FUNDING;

  const [totalSupply, setTotalSupply] = useState(new BigNumber(0));
  const stakedBalance: BigNumber = details['Staked balance'] || new BigNumber(0);
  const minimumStakeBalance = BalancedJs.utils.toIcx(totalSupply).times(0.1 / 100);
  const isStakeValid = stakedBalance.isGreaterThanOrEqualTo(minimumStakeBalance);

  useEffect(() => {
    (async () => {
      const totalSupply = await bnJs.BALN.totalSupply();
      setTotalSupply(totalSupply);
    })();
  }, []);

  const { data: platformDay } = usePlatformDayQuery();

  // @ts-ignore
  const { submitParams, validate } = isTextProposal ? {} : PROPOSAL_CONFIG[selectedProposalType];

  //Validation
  const validateRatioInput = () => {
    const arrayRatioValue = Object.values(ratioInputValue);
    const isEmpty = arrayRatioValue.every(ratio => ratio === '');
    if (isEmpty) return { isValid: false };
    const totalRatio = arrayRatioValue.reduce((sum: number, currentValue: string) => sum + Number(currentValue), 0);

    return !!validate && validate(totalRatio);
  };

  const isFormValid =
    title.trim() &&
    description.trim() &&
    forumLink.trim() &&
    (isTextProposal ||
      (Object.values(ratioInputValue).length > 0 && Object.values(ratioInputValue).every(ratio => !!ratio.trim())) ||
      (isFundingProposal &&
        !!currencyInputValue.recipient.trim() &&
        currencyInputValue.amounts.some(amount => amount.inputDisplayValue)));

  const canSubmit = account && isStakeValid && isFormValid;

  const { isValid, message } = validateRatioInput();
  const isForumLinkValid =
    forumLink.startsWith('https://gov.balanced.network') || forumLink.startsWith('gov.balanced.network');

  const onTitleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle(event.currentTarget.value);
  };

  const onForumInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setForumLink(event.currentTarget.value);
    showError.forumLink &&
      setShowError({
        ...showError,
        forumLink: false,
      });
  };

  const onTextAreaInputChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setDescription(event.currentTarget.value);
  };

  const onRatioInputChange = (value: string, recipent_name: string) => {
    setRatioInputValue({ ...ratioInputValue, [recipent_name]: value });
    showError.ratio &&
      setShowError({
        ...showError,
        ratio: false,
      });
  };

  const scrollToTop = () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  };

  const formSubmit = () => {
    scrollToTop();
    const invalidInput = {
      forumLink: !isForumLinkValid,
      ratio: message && !isValid,
    };
    if (invalidInput.forumLink || invalidInput.ratio) {
      scrollToTop();
      setShowError(invalidInput);
    } else {
      toggleOpen();
    }
  };

  useEffect(() => setRatioInputValue({}), [selectedProposalType]);

  const resetForm = () => {
    setTitle('');
    setForumLink('');
    setDescription('');
    setRatioInputValue({});
    setCurrencyInputValue({
      recipient: '',
      amounts: [{ item: CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_LIST[0], 0) }],
    });
  };

  const modalSubmit = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    let fundingAction = JSON.stringify(submitParams(currencyInputValue));

    currencyInputValue.amounts.map((amount, idx) => {
      if (amount.inputDisplayValue)
        fundingAction = fundingAction.replace(
          `"[amount${idx}]"`,
          BalancedJs.utils.toLoop(JSBI.toNumber(amount.item.numerator)).toFixed(),
        );
      return null;
    });

    const actions = isTextProposal
      ? '{}'
      : isFundingProposal
      ? fundingAction
      : JSON.stringify(submitParams(ratioInputValue));

    platformDay &&
      bnJs
        .inject({ account })
        .Governance.defineVote(title, description, platformDay + 1, platformDay, actions)
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Submitting a proposal...',
                summary: `${selectedProposalType} proposal submitted.`,
              },
            );
            toggleOpen();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          resetForm();
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
  };

  const handleProposalTypeSelect = (type: PROPOSAL_TYPE) => {
    setProposalType(type);
  };

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <NewProposalContainer>
        <Breadcrumb title={'New proposal'} locationText={'Vote'} locationPath={'/vote'} />
        <ProposalTypesSelect onSelect={handleProposalTypeSelect} selected={selectedProposalType} />
        <ProposalDetailContainer>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Title
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${title.length}/100`}
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onTitleInputChange} value={title} maxLength={100} />
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
            show={showError.forumLink}
          >
            <FieldInput type="text" onChange={onForumInputChange} value={forumLink} />
          </Tooltip>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Description
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${description.length}/500`}
            </Typography>
          </FieldContainer>
          <FieldTextArea onChange={onTextAreaInputChange} value={description} maxLength={500} />
          {!(isTextProposal || isFundingProposal) && (
            <RatioInput
              onRatioChange={onRatioInputChange}
              showErrorMessage={showError.ratio}
              value={ratioInputValue}
              message={message}
              proposalType={selectedProposalType}
              setInitialValue={setRatioInputValue}
            />
          )}
          {isFundingProposal && (
            <FundingInput currencyValue={currencyInputValue} setCurrencyValue={setCurrencyInputValue} />
          )}
          <Typography variant="content" mt="25px" mb="25px" textAlign="center">
            It costs 100 bnUSD to submit a proposal.
          </Typography>
          <div style={{ textAlign: 'center' }}>
            <Button disabled={!canSubmit} onClick={formSubmit}>
              Submit
            </Button>
          </div>
          {account && !isStakeValid && minimumStakeBalance && (
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
                <Button onClick={modalSubmit} fontSize={14} disabled={!hasEnoughICX}>
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
