import React from 'react';

import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'demo';

const LoanPanel = () => {
  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(false);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanEditing(false);
  };

  return (
    <BoxPanel bg="bg3">
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="h2">Loan</Typography>

        <Box>
          {isLoanEditing ? (
            <>
              <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
              <Button>Confirm</Button>
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
  );
};

export default LoanPanel;
