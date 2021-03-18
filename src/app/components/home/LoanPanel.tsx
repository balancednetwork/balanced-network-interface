import React from 'react';

import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';

const LoanPanel = () => {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(false);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanEditing(false);
  };

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Loan</Typography>

          <Box>
            {isLoanEditing ? (
              <>
                <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            ) : (
              <Button onClick={handleLoanAdjust}>Borrow</Button>
            )}
          </Box>
        </Flex>

        <Box marginY={6}>
          <Nouislider
            disabled={!isLoanEditing}
            id="slider-collateral"
            start={[10000]}
            padding={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [15000],
            }}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            <CurrencyField
              editable={isLoanEditing}
              isActive
              label="Borrowed"
              tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
              value={'37533'}
              currency={CURRENCYLIST['bnusd']}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              editable={isLoanEditing}
              isActive={false}
              label="Available"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={'34740'}
              currency={CURRENCYLIST['bnusd']}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Borrow Balanced Dollars?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            0 bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                5,560 bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                5,560 bnUSD
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Includes a fee of 14 bnUSD.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button fontSize={14}>Borrow</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default LoanPanel;
