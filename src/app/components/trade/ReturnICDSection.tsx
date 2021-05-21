import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import ShouldLedgerConfirmMessage from 'app/components/DepositStakeMessage';
import Divider from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST } from 'constants/currency';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { retireMessage } from './utils';

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 15px;
`;

const ReturnICDSection = () => {
  const wallet = useWalletBalances();
  const ratio = useRatio();
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const [retireAmount, setRetireAmount] = React.useState('');
  const [receiveAmount, setReceiveAmount] = React.useState('0');
  const [open, setOpen] = React.useState(false);
  const toggleWalletModal = useWalletModalToggle();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const calculate_return_sicx = React.useCallback(
    async (retireAmount: string, returnFee: boolean) => {
      const res = await bnJs.inject({ account }).Loans.getParameters();

      const redemption_fee = parseInt(res[`redemption fee`], 16);
      const icx_price = 1 / ratio.ICXUSDratio.toNumber();
      const points = 10000;

      return new BigNumber(
        (parseFloat(retireAmount) * icx_price * (points - redemption_fee)) / (ratio.sICXICXratio.toNumber() * points),
      );
    },
    [account, ratio],
  );

  const [retireRatio, setRetireRatio] = React.useState('0');
  React.useEffect(() => {
    const result = async () => {
      setRetireRatio(formatBigNumber(await await calculate_return_sicx('1', true), 'currency'));
    };
    result();
  }, [calculate_return_sicx]);

  const handleTypeInput = React.useCallback(
    async (val: string) => {
      setRetireAmount(val);
      setReceiveAmount(
        isNaN(parseFloat(val))
          ? formatBigNumber(new BigNumber(0), 'currency')
          : formatBigNumber(await calculate_return_sicx(val, false), 'currency'),
      );
    },
    [calculate_return_sicx],
  );

  // handle retire balance dropdown
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  //
  const upSmall = useMedia('(max-width: 800px)');

  if (upSmall) {
    return null;
  }

  const toggleOpen = () => {
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
    changeShouldLedgerSign(false);
  };

  const handleRetireConfirm = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account: account })
      .Loans.returnAsset('bnUSD', BalancedJs.utils.toLoop(new BigNumber(retireAmount)))
      .then((res: any) => {
        setOpen(false);
        addTransaction(
          { hash: res.result },
          {
            pending: retireMessage(receiveAmount, 'sICX').pendingMessage,
            summary: retireMessage(receiveAmount, 'sICX').successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
      });
  };

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
                  currency={CURRENCY_LIST['bnusd']}
                  value={retireAmount}
                  onUserInput={handleTypeInput}
                  showMaxButton={false}
                  id="return-icd-input"
                  bg="bg5"
                />

                <Flex flexDirection="column" alignItems="flex-end">
                  <Typography>1 bnUSD = {retireRatio} sICX</Typography>
                </Flex>

                <Divider />

                <Flex alignItems="flex-start" justifyContent="space-between">
                  <Typography variant="p">Total</Typography>
                  <Flex flexDirection="column" alignItems="flex-end">
                    <Typography variant="p">{receiveAmount} sICX</Typography>
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
                {receiveAmount} sICX
              </Typography>
              <Typography textAlign="center">
                ~{' '}
                {formatBigNumber(new BigNumber(parseFloat(receiveAmount) * ratio.sICXICXratio?.toNumber()), 'currency')}{' '}
                ICX
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleRetireDismiss}>Cancel</TextButton>
            <Button onClick={handleRetireConfirm}>Confirm</Button>
          </Flex>
          {shouldLedgerSign && <ShouldLedgerConfirmMessage />}
        </Flex>
      </Modal>
    </>
  );
};

export default ReturnICDSection;
