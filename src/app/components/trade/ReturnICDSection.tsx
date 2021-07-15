import React from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { ONE } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import { retireMessage } from './utils';

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 15px;
`;

const useRedemptionFee = () => {
  const [redemptionFee, setRedemptionFee] = React.useState(500);

  React.useEffect(() => {
    const fetchFee = async () => {
      const res = await bnJs.Loans.getParameters();
      setRedemptionFee(parseInt(res[`redemption fee`], 16));
    };
    fetchFee();
  }, []);

  return redemptionFee;
};

const useRetireRatio = () => {
  const ratio = useRatio();
  const redemptionFee = useRedemptionFee();
  const points = 10000;
  return ONE.div(ratio.sICXICXratio.times(ratio.ICXUSDratio)).times((points - redemptionFee) / points);
};

const ReturnICDSection = () => {
  const wallet = useWalletBalances();
  const ratio = useRatio();
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const [retireAmount, setRetireAmount] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const toggleWalletModal = useWalletModalToggle();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const retireRatio = useRetireRatio();
  const receiveAmount = retireRatio.times(retireAmount || 0);

  const handleTypeInput = (val: string) => {
    setRetireAmount(val);
  };

  // handle retire balance dropdown
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  const toggleOpen = () => {
    if (shouldLedgerSign) return;

    setOpen(!open);
  };

  const handleRetire = () => {
    if (!account) {
      closeDropdown();
      toggleWalletModal();
    } else {
      closeDropdown();
      setOpen(true);
    }
  };

  const handleRetireDismiss = () => {
    setOpen(false);
  };

  const handleRetireConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account: account })
      .Loans.returnAsset('bnUSD', BalancedJs.utils.toLoop(retireAmount), 0)
      .then((res: any) => {
        setOpen(false);

        addTransaction(
          { hash: res.result },
          {
            pending: retireMessage(receiveAmount.dp(2).toFormat(), 'sICX').pendingMessage,
            summary: retireMessage(receiveAmount.dp(2).toFormat(), 'sICX').successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        changeShouldLedgerSign(false);
      });
  };

  const hasEnoughICX = useHasEnoughICX();

  // disable retire bnUSD feature in small screens
  const upSmall = useMedia('(max-width: 800px)');

  if (upSmall) {
    return null;
  }

  return (
    <>
      <ClickAwayListener onClickAway={closeDropdown}>
        <div>
          <UnderlineTextWithArrow onClick={handleToggleDropdown} text="Retire Balanced assets" arrowRef={arrowRef} />

          <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
            <Box padding={5} bg="bg4" maxWidth={350}>
              <Grid>
                <Typography variant="h2">Retire bnUSD</Typography>

                {/* <Typography>Sell your bnUSD for $1 of sICX (staked ICX).</Typography> */}

                <Flex flexDirection="column" alignItems="flex-end" mt={1}>
                  <Typography>
                    Wallet:{' '}
                    <span style={{ color: '#2fccdc' }}>{formatBigNumber(wallet['bnUSD'], 'currency')} bnUSD</span>
                  </Typography>
                </Flex>

                <CurrencyInputPanel
                  currency={'bnUSD'}
                  value={retireAmount}
                  onUserInput={handleTypeInput}
                  showMaxButton={false}
                  id="return-icd-input"
                  bg="bg5"
                />

                <Flex flexDirection="column" alignItems="flex-end">
                  <Typography>1 bnUSD = {formatBigNumber(retireRatio, 'currency')} sICX</Typography>
                </Flex>

                <Divider />

                <Flex alignItems="flex-start" justifyContent="space-between">
                  <Typography variant="p">Total</Typography>
                  <Flex flexDirection="column" alignItems="flex-end">
                    <Typography variant="p">{formatBigNumber(receiveAmount, 'currency')} sICX</Typography>
                  </Flex>
                </Flex>
                <Typography mt={2}>
                  The maximum retire amount will vary with <br />
                  each transaction.
                </Typography>
              </Grid>

              <Flex justifyContent="center" mt={5}>
                <Button onClick={handleRetire}>Retire bnUSD</Button>
              </Flex>
            </Box>
          </DropdownPopper>
        </div>
      </ClickAwayListener>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Retire Balanced Dollars?
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Retire</Typography>
              <Typography variant="p" textAlign="center">
                {retireAmount} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(receiveAmount, 'currency')} sICX
              </Typography>
              <Typography textAlign="center">
                ~ {formatBigNumber(receiveAmount.times(ratio.sICXICXratio), 'currency')} ICX
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleRetireDismiss}>Cancel</TextButton>
                <Button onClick={handleRetireConfirm} disabled={!hasEnoughICX}>
                  Confirm
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
};

export default ReturnICDSection;
