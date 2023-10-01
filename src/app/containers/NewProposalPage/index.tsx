import React, { useCallback, useState } from 'react';

import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import QuestionHelper from 'app/components/QuestionHelper';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { usePlatformDayQuery } from 'queries/reward';
import { useMinBBalnPercentageToSubmit } from 'queries/vote';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useEditableContractCalls, useResetArbitraryCalls } from 'store/arbitraryCalls/hooks';
import { useBBalnAmount, useFetchBBalnInfo, useTotalSupply } from 'store/bbaln/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletFetchBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ArbitraryCallsForm from './ArbitraryCalls/ArbitraryCallsForm';
import { getTransactionsString } from './ArbitraryCalls/utils';

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

export const FieldInput = styled.input`
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: 10px;
  width: 100%;
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 20px;
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  background-color: ${({ theme }) => theme.colors.bg5};
  transition: all ease 0.3s;
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  -moz-appearance: textfield;
  :disabled {
    opacity: 0;
    border: 2px solid ${({ theme }) => theme.colors.bg5};
    cursor: default;
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
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account, accountArch);
  const theme = useTheme();
  const bBalnAmount = useBBalnAmount();
  const { data: minPercentage } = useMinBBalnPercentageToSubmit();
  const resetArbitraryCalls = useResetArbitraryCalls();

  //Form
  const [title, setTitle] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

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

  //verification modal
  const [isVerificationModalOpen, setVerificationModalOpen] = React.useState(false);

  // const { isScoreAddress } = Validator;

  const totalSupply = useTotalSupply();
  const minimumBBalnAmount = totalSupply && minPercentage && totalSupply.times(minPercentage);
  const isBBalnValid = minimumBBalnAmount && bBalnAmount.isGreaterThanOrEqualTo(minimumBBalnAmount);
  const arbitraryCalls = useEditableContractCalls();

  const { data: platformDay } = usePlatformDayQuery();

  const isForumLinkValid =
    forumLink.startsWith('https://gov.balanced.network') || forumLink.startsWith('gov.balanced.network');

  const isFormValid = title.trim() && description.trim() && forumLink.trim() && isForumLinkValid && duration.trim();

  const canSubmit = account && isBBalnValid && isFormValid;

  const onTitleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle(event.currentTarget.value);
  };

  const onDurationInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = parseInt(event.currentTarget.value);
    if (0 < value && value < 15) {
      setDuration(event.currentTarget.value);
    } else if (isNaN(value)) {
      setDuration('');
    }
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

  const scrollToTop = () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  };

  const formSubmit = () => {
    scrollToTop();
    const invalidInput = {
      forumLink: !isForumLinkValid,
    };
    if (invalidInput.forumLink) {
      scrollToTop();
    } else {
      toggleOpen();
    }
  };

  const resetForm = () => {
    setTitle('');
    setForumLink('');
    setDuration('');
    setDescription('');
    resetArbitraryCalls();
  };

  const modalSubmit = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    platformDay &&
      bnJs
        .inject({ account })
        .Governance.defineVote(
          title,
          description,
          platformDay + 1,
          parseInt(duration),
          forumLink,
          getTransactionsString(arbitraryCalls),
        )
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: t`Submitting a proposal...`,
                summary: t`Proposal submitted.`,
                redirectOnSuccess: '/vote',
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

  const tryExecute = useCallback(() => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    platformDay &&
      bnJs
        .inject({ account })
        .Governance.tryExecuteTransactions(getTransactionsString(arbitraryCalls))
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: t`Verifying contract calls...`,
                summary: t`Executed.`,
              },
            );
            setVerificationModalOpen(false);
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
  }, [account, addTransaction, arbitraryCalls, changeShouldLedgerSign, platformDay]);

  return (
    <>
      <NewProposalContainer>
        <Breadcrumb title={t`New proposal`} locationText={t`Vote`} locationPath={'/vote'} />
        <ProposalDetailContainer>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              <Trans>Title</Trans>
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${title.length}/100`}
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onTitleInputChange} value={title} maxLength={100} />
          <Flex flexDirection={['column', 'column', 'row']}>
            <Box style={{ flexGrow: 1 }} mr={[0, 0, 6]}>
              <FieldContainer>
                <Typography variant="h3" flex="1" alignSelf="center">
                  <Trans>Forum link</Trans>
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
            </Box>
            <Box>
              <FieldContainer>
                <Typography variant="h3" flex="1" alignSelf="center">
                  <Trans>Duration</Trans>{' '}
                  <QuestionHelper
                    width={240}
                    text={
                      <>
                        <Typography mb={2}>
                          <Trans>How long the vote should last (1 – 14 days).</Trans>
                        </Typography>
                        <Typography>
                          <Trans>
                            5 days is standard. Use less for an emergency vote, more for maximum participation.
                          </Trans>
                        </Typography>
                      </>
                    }
                  ></QuestionHelper>
                </Typography>
              </FieldContainer>
              <FieldInput
                type="number"
                onChange={onDurationInputChange}
                value={duration}
                style={{ minWidth: '180px' }}
              />
            </Box>
          </Flex>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              <Trans>Description</Trans>
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${description.length}/500`}
            </Typography>
          </FieldContainer>
          <FieldTextArea onChange={onTextAreaInputChange} value={description} maxLength={500} />

          <ArbitraryCallsForm openVerificationModal={setVerificationModalOpen} />

          <Typography variant="content" mt="25px" mb="25px" textAlign="center">
            <Trans>It costs 100 bnUSD to submit a proposal.</Trans>
          </Typography>
          <div style={{ textAlign: 'center' }}>
            <Button disabled={!canSubmit} onClick={formSubmit}>
              <Trans>Submit</Trans>
            </Button>
          </div>
          {account && !isBBalnValid && minimumBBalnAmount && (
            <Typography variant="content" mt="25px" mb="25px" textAlign="center" color={theme.colors.alert}>
              <Trans>You must have at least {minimumBBalnAmount.dp(2).toFormat()} bBALN to propose a change.</Trans>
            </Typography>
          )}
        </ProposalDetailContainer>
      </NewProposalContainer>
      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            <Trans>Submit proposal?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            <Trans>100 bnUSD</Trans>
          </Typography>

          <Typography textAlign="center" marginTop="10px">
            <Trans>Voting will begin at 5pm UTC,</Trans>
            <br />
            {t`and ends after ${duration} days.`}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner />}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Go back</Trans>
                </TextButton>
                <Button onClick={modalSubmit} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Submit proposal</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>

      {/* Contract calls verification modal */}
      <Modal isOpen={isVerificationModalOpen} onDismiss={() => setVerificationModalOpen(false)}>
        <ModalContent>
          <Typography color="text" fontSize={20} fontWeight="bold" textAlign="center" mb="5px">
            <Trans>Verify contract calls?</Trans>
          </Typography>

          <Typography color="text" textAlign="center" marginTop="10px">
            <Trans>Check that your contract calls are set up correctly before you submit the proposal.</Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner />}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={() => setVerificationModalOpen(false)} fontSize={14}>
                  <Trans>Go back</Trans>
                </TextButton>
                <Button onClick={tryExecute} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Verify</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
