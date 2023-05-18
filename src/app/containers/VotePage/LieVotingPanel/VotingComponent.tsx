import React, { useState } from 'react';

import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import { inputRegex } from 'app/components/CurrencyInputPanel';
import { UnderlineText } from 'app/components/DropdownText';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as EditIcon } from 'assets/icons/edit.svg';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import {
  useChangeEditing,
  useChangeInputValue,
  useChangeShowConfirmation,
  useEditState,
  useEditValidation,
  useUnlockDateToBeSet,
  useUserVoteData,
} from 'store/liveVoting/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { escapeRegExp, ONE_DAY_DURATION } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { AllocationInput, RespoLabel, StyledQuestionIcon, VotingButtons } from '../styledComponents';
import { formatFraction, formatTimeLeft, formatVoteWeight, getUserCurrentAllocationFormatted } from '../utils';

interface VotingComponentProps {
  name: string;
  respoLayout: boolean;
}

export default function VotingComponent({ name, respoLayout }: VotingComponentProps) {
  const userVoteData = useUserVoteData();
  const changeShowConfirmation = useChangeShowConfirmation();
  const changeEditing = useChangeEditing();
  const changeInputValue = useChangeInputValue();
  const { account } = useIconReact();
  const { editing, inputValue, showConfirmation } = useEditState();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const shouldLedgerSign = useShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const isInputValid = useEditValidation();
  const { data: unlockDateToBeSet } = useUnlockDateToBeSet();

  const [show, setShow] = useState(false);

  const hasVoted: boolean = userVoteData && userVoteData[name] && !!userVoteData[name].lastVote;
  const voteExpiry: Date | undefined =
    hasVoted && userVoteData && userVoteData[name]
      ? new Date(userVoteData[name].lastVote.getTime() + ONE_DAY_DURATION * 10)
      : undefined;
  const hasActiveLock = hasVoted && voteExpiry && voteExpiry > new Date();

  const handleConfirmVote = async () => {
    const allocation = formatVoteWeight(inputValue);
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    try {
      const { result: hash } = await bnJs.inject({ account }).Rewards.voteForSource(editing, allocation);
      addTransaction(
        { hash },
        {
          pending: t`Allocating bBALN...`,
          summary: t`${inputValue}% of bBALN allocated to ${editing}.`,
        },
      );
    } catch (e) {
      console.error(e);
    } finally {
      changeShouldLedgerSign(false);
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    }
    changeShowConfirmation(false);
    changeEditing('');
  };

  const handleEditToggle = (name: string) => {
    if (name !== '' && userVoteData && userVoteData[name]) {
      changeInputValue(formatFraction(userVoteData[name].power, ''));
    } else {
      changeInputValue('');
    }
    changeEditing(name);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      (nextUserInput === '' || parseFloat(nextUserInput) <= 100) &&
        (!nextUserInput.split('.')[1] || nextUserInput.split('.')[1].length <= 2) &&
        changeInputValue(nextUserInput);
    }
  };

  const handleAllocationInputChange = e => {
    const { value } = e.target;
    enforcer(value.replace(/,/g, '.'));
  };

  return (
    <>
      <Flex alignItems={respoLayout ? 'center' : 'end'} mb={respoLayout ? 4 : 0}>
        {respoLayout && (
          <RespoLabel>
            <Trans>Your allocation</Trans>
          </RespoLabel>
        )}

        <Flex
          alignItems="flex-end"
          width={respoLayout ? 'auto' : '100%'}
          flexDirection="column"
          justifyContent="center"
          alignSelf="center"
        >
          {editing === name ? (
            <Flex flexDirection="column" width={155}>
              <AllocationInput
                type="text"
                value={inputValue}
                onChange={handleAllocationInputChange}
                autoFocus={true}
                placeholder="%"
                valid={isInputValid}
              />
              <VotingButtons>
                <TextButton onClick={() => handleEditToggle('')}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button disabled={!isInputValid || !inputValue} onClick={() => changeShowConfirmation(true)}>
                  <Trans>Confirm</Trans>
                </Button>
              </VotingButtons>
            </Flex>
          ) : hasVoted ? (
            <>
              <Flex alignItems="center">
                {voteExpiry && (
                  <Tooltip
                    show={show}
                    text={
                      <Typography>
                        <strong>{formatTimeLeft(voteExpiry)}</strong>{' '}
                        <Trans>left until you can adjust your allocation.</Trans>
                      </Typography>
                    }
                    strategy="fixed"
                    placement="top"
                    offset={[0, 18]}
                    width={220}
                  >
                    <>
                      <Typography fontSize={16} color="text">
                        {userVoteData && userVoteData[name] ? formatFraction(userVoteData[name].power) : '-'}
                      </Typography>
                    </>
                  </Tooltip>
                )}
                {hasActiveLock ? (
                  voteExpiry && (
                    <StyledQuestionIcon
                      width={14}
                      style={{ margin: '4px 0px 5px 7px' }}
                      onMouseOver={() => setShow(true)}
                      onMouseLeave={() => setShow(false)}
                    />
                  )
                ) : (
                  <Flex onClick={() => handleEditToggle(name)} sx={{ margin: '4px 0px 4px 6px', cursor: 'pointer' }}>
                    <EditIcon width={15} />
                  </Flex>
                )}
              </Flex>
              <Typography fontSize={14} color="text1">
                {userVoteData && getUserCurrentAllocationFormatted(userVoteData[name])}
              </Typography>
            </>
          ) : (
            <UnderlineText onClick={() => handleEditToggle(name)}>
              <Typography color="primaryBright">Add</Typography>
            </UnderlineText>
          )}
        </Flex>
      </Flex>

      <Modal isOpen={showConfirmation && editing === name} onDismiss={() => changeShowConfirmation(false)}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            <Trans>Adjust liquidity allocation?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20} mb={2}>
            {editing}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {userVoteData && userVoteData[editing] ? formatFraction(userVoteData[editing].power) : '0%'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {inputValue || '0'}%
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center" fontSize={14} mb={1}>
            {t`You'll be able to readjust your allocation for this pool on`} <strong>{unlockDateToBeSet}</strong>.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={() => changeShowConfirmation(false)} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleConfirmVote} fontSize={14}>
                  {t`Adjust allocation`}
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
}
