import { Typography } from '@/app/theme';
import React, { useState } from 'react';
import { Box, Flex } from 'rebass';
import { UnderlineText } from '../../DropdownText';
import { Link } from '../../Link';
import { useHasLockExpired, useLockedBaln } from '@/store/bbaln/hooks';
import { Button, TextButton } from '../../Button';
import Modal from '../../Modal';
import ModalContent from '../../ModalContent';
import { useIconReact } from '@/packages/icon-react';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import CurrencyBalanceErrorMessage from '../../CurrencyBalanceErrorMessage';
import { bnJs } from '@balancednetwork/xwagmi';
import { t, Trans } from '@lingui/macro';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { ResponseJsonRPCPayload } from '@balancednetwork/balanced-js';

export default function BALNWithdrawalNotice({ variant = 'hp' }: { variant?: 'hp' | 'voting' }) {
  const { account } = useIconReact();
  const lockedBalnAmount = useLockedBaln();
  const { data: hasLockExpired } = useHasLockExpired();
  const hasLockedBaln = lockedBalnAmount && lockedBalnAmount.greaterThan(0);
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const toggleWithdrawModalOpen = () => {
    setWithdrawModalOpen(!withdrawModalOpen);
  };

  const handleWithdraw = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    let response: ResponseJsonRPCPayload | null = null;

    try {
      if (hasLockExpired) {
        response = await bnJs.inject({ account }).BBALN.withdraw();
      } else {
        response = await bnJs.inject({ account }).BBALN.withdrawEarly();
      }

      const hash = response.result;

      addTransaction(
        { hash },
        {
          pending: t`Withdrawing BALN...`,
          summary: t`${lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN withdrawn.`,
        },
      );
    } catch (e) {
      console.error(e);
    } finally {
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    }
    setWithdrawModalOpen(false);
  };

  return (
    <>
      <Flex>
        <Box maxWidth={'720px'} margin={variant === 'hp' ? '0' : '0 auto'}>
          {variant === 'hp' ? (
            <Typography variant="h4">Balanced is now a frontend for SODAX</Typography>
          ) : (
            <Typography textAlign={['left', 'left', 'center']} mb={-1} fontWeight="bold" fontSize={18}>
              Balanced is now a frontend for SODAX
            </Typography>
          )}

          <Typography mt={3} color="text1" textAlign={['left', 'left', variant === 'hp' ? 'left' : 'center']}>
            Governance, network fees, and boosted rewards have been removed, and BALN will be discontinued. Withdraw
            your BALN for no fee so you can sell it or convert it to SODA.
          </Typography>
          <Flex
            alignItems={['start', 'center']}
            justifyContent="center"
            mt={3}
            flexDirection={['column', 'column', 'row']}
          >
            <UnderlineText>
              <Link href="https://blog.balanced.network/governance-retirement/" target="_blank" rel="noreferrer">
                Learn more
              </Link>
            </UnderlineText>
            {account && hasLockedBaln && (
              <Button ml={['0', '0', '5']} onClick={toggleWithdrawModalOpen} mt={['15px', '15px', 0]}>
                Withdraw {lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN
              </Button>
            )}
          </Flex>
        </Box>
      </Flex>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModalOpen} onDismiss={toggleWithdrawModalOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="10px">
            <Trans>Withdraw Balance Tokens?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            <TextButton onClick={toggleWithdrawModalOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button disabled={!hasEnoughICX} onClick={handleWithdraw} fontSize={14}>
              {t`Withdraw BALN`}
            </Button>
          </Flex>

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </ModalContent>
      </Modal>
    </>
  );
}
