import React from 'react';

import { Trans, t } from '@lingui/macro';
import dayjs from 'dayjs';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import { StyledSkeleton } from 'app/components/ProposalInfo/components';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBBalnAmount } from 'store/bbaln/hooks';
import { useNextUpdateDate, useUserVoteData } from 'store/liveVoting/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { formatTimeLeft } from '../utils';
import { Bribe } from './types';

const BribedSourceWrap = styled.div`
  padding: 25px;
  background: ${({ theme }) => theme.colors.bg3};
  border-radius: 10px;
`;

export const BribeSkeleton = () => {
  const { account } = useIconReact();
  return (
    <BribedSourceWrap>
      <Typography fontWeight={700} fontSize={16} mb={2}>
        <StyledSkeleton width={100} style={{ marginLeft: 'auto', marginRight: 'auto' }} />
      </Typography>

      <Typography fontSize={14}>
        <StyledSkeleton width={150} style={{ marginLeft: 'auto', marginRight: 'auto', marginBottom: '2px' }} />
        <StyledSkeleton width={150} style={{ marginLeft: 'auto', marginRight: 'auto', marginBottom: '2px' }} />
        <StyledSkeleton width={150} style={{ marginLeft: 'auto', marginRight: 'auto', marginBottom: '2px' }} />
      </Typography>
      {account && (
        <>
          <Divider my={3} />
          <Typography fontSize={14}>
            <StyledSkeleton width={130} style={{ marginLeft: 'auto', marginRight: 'auto' }} />
            <StyledSkeleton width={100} style={{ marginLeft: 'auto', marginRight: 'auto' }} />
          </Typography>
        </>
      )}
    </BribedSourceWrap>
  );
};

const UserBribeState = ({ bribe }: { bribe: Bribe }) => {
  const { account } = useIconReact();
  const bBalnAmount = useBBalnAmount();
  const userVoteData = useUserVoteData();
  const nextUpdateDate = useNextUpdateDate();
  const hasUserVotedForSource = userVoteData && Object.keys(userVoteData).includes(bribe.sourceName);
  const shouldLedgerSign = useShouldLedgerSign();
  const hasEnoughICX = useHasEnoughICX();
  const addTransaction = useTransactionAdder();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const [isOpen, setOpen] = React.useState(false);

  const openModal = React.useCallback(() => setOpen(true), []);
  const closeModal = React.useCallback(() => setOpen(false), []);

  const handleBribeClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Bribe.claimBribe(bribe.sourceName, bribe.bribeToken)
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            summary: t`Claimed ${bribe.claimable?.toFixed(2, { groupSeparator: ',' })} ${
              bribe.claimable.currency.symbol
            }.`,
            pending: t`Claiming bribe...`,
          },
        );
        closeModal();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  return account ? (
    <>
      <Divider my={3} />
      {bBalnAmount.isGreaterThan(0) ? (
        hasUserVotedForSource ? (
          bribe.claimable?.greaterThan(0) ? (
            <>
              <Typography textAlign="center" color="text">{t`${bribe.claimable.toFixed(2, { groupSeparator: ',' })} ${
                bribe.claimable.currency.symbol
              } available`}</Typography>
              <Flex width="100%" justifyContent="center" mt={3}>
                <Button onClick={openModal}>
                  <Trans>Claim</Trans>
                </Button>
              </Flex>
            </>
          ) : (
            <>
              <Typography textAlign="center" color="text">
                <Trans>Bribe available in</Trans>
              </Typography>
              <Typography textAlign="center" color="text">
                {formatTimeLeft(nextUpdateDate)}
              </Typography>
            </>
          )
        ) : (
          <Typography textAlign="center" color="text">
            <Trans>Vote for this pool to receive bribes.</Trans>
          </Typography>
        )
      ) : (
        <Typography textAlign="center" color="text">
          <Trans>Lock up BALN and vote for this pool to receive bribes.</Trans>
        </Typography>
      )}

      <Modal isOpen={isOpen} onDismiss={closeModal}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            {t`Claim ${bribe.sourceName.replace('/', ' / ')} bribe?`}
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            <Typography variant="p">
              {`${bribe.claimable?.toFixed(2, { groupSeparator: ',' })} ${bribe.claimable?.currency.symbol}`}{' '}
            </Typography>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={closeModal} fontSize={14}>
                  <Trans>Not now</Trans>
                </TextButton>
                <Button onClick={handleBribeClaim} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Claim</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  ) : null;
};

export default function BribedSource({ bribe }: { bribe: Bribe }) {
  return (
    <BribedSourceWrap>
      <Typography fontWeight={700} color="text" fontSize={16} textAlign="center" mb={2}>
        {bribe.sourceName.replace('/', ' / ')}
      </Typography>
      {bribe.futureBribes.map((futureBribe, index) => (
        <Flex width="100%" justifyContent="center" key={index} mb="2px">
          <Typography mr="5px" textAlign="center">
            {`${dayjs(futureBribe.timestamp).format('MMM DD')}: ${
              futureBribe.bribe.greaterThan(0)
                ? `${futureBribe.bribe.toFixed(0, { groupSeparator: ',' })} ${futureBribe.bribe.currency.symbol}`
                : '-'
            }`}
          </Typography>
        </Flex>
      ))}
      <UserBribeState bribe={bribe} />
    </BribedSourceWrap>
  );
}
