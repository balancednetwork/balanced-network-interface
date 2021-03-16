import React from 'react';

import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { QuestionWrapper } from 'app/components/QuestionHelper';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
  `}
`;

const Chip = styled(Box)`
  display: inline-block;
  min-width: 82px;
  text-align: center;
  border-radius: 100px;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
`;

const Threshold = styled(Box)`
  position: absolute;
  width: 1px;
  height: 50px;
  margin-top: -33px;
  background-color: #ffffff;
  z-index: 2;
  transition: color 0.3s ease;

  ::after {
    position: absolute;
    content: '';
    top: 0;
    width: 10px;
    height: 1px;
    margin-left: -10px;
    background-color: #ffffff;
    z-index: 2;
    transition: height 0.3s ease;
  }
`;

const MetaData = styled(Box)`
  font-size: 14px;
  margin-top: -10px;
`;

const Rewards = styled(Threshold)`
  left: 53.2%;
  /* text-align: right; */

  ${MetaData} {
    width: 125px;
    margin-left: -140px;
  }
`;

const Locked = styled(Threshold)`
  left: 66.5%;

  ::after {
    margin-left: initial;
  }

  ${MetaData} {
    width: 150px;
    margin-left: 15px;
  }
`;

const PositionDetailPanel = () => {
  const [show, setShow] = React.useState<boolean>(false);

  const open = React.useCallback(() => setShow(true), [setShow]);
  const close = React.useCallback(() => setShow(false), [setShow]);

  return (
    <ActivityPanel bg="bg2">
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 350]}>
        <Typography variant="h2" mb={5}>
          Position detail
        </Typography>

        <Flex>
          <Box width={1 / 2}>
            <Typography mb={1}>Collateral</Typography>
            <Typography variant="p" fontSize={18}>
              $10,349
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography mb={1}>Loan</Typography>
            <Typography variant="p" fontSize={18} as="span">
              $1,512 <Typography as="span">/ $2,587</Typography>
            </Typography>
          </Box>
        </Flex>
        <Divider my={4} />
        <Typography mb={2}>
          The current ICX price is <span className="alert">$0.2400</span>.
        </Typography>
        <Typography>
          You hold <span className="white">0.15%</span> of the total debt.
        </Typography>
      </BoxPanel>
      <BoxPanel bg="bg2" flex={1}>
        <Typography variant="h3">
          Risk ratio{' '}
          <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
            <QuestionIcon width={14} />
          </QuestionWrapper>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between" my={4}>
          <Tooltip
            text="If the bar only fills this section, you have a low risk of liquidation."
            show={show}
            placement="bottom"
          >
            <Chip bg="primary">Low risk</Chip>
          </Tooltip>

          <Box flex={1} mx={1} style={{ position: 'relative' }}>
            <Rewards>
              <MetaData as="dl">
                <Tooltip
                  text="You won’t earn any Balance Tokens if you go beyond this threshold."
                  show={show}
                  placement="top-end"
                >
                  <dt>Reward threshold</dt>
                </Tooltip>
                <dd>$1.2798</dd>
              </MetaData>
            </Rewards>

            <Locked>
              <MetaData as="dl">
                <Tooltip
                  text="You can’t withdraw any collateral if you go beyond this threshold."
                  show={show}
                  placement="top-start"
                >
                  <dt>All collateral locked</dt>
                </Tooltip>
                <dd>$1.0239</dd>
              </MetaData>
            </Locked>

            <Nouislider
              disabled={true}
              id="risk-ratio"
              start={[10000]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [15000],
              }}
            />
          </Box>

          <Tooltip
            text="If the ICX price reaches $0.8618, your collateral will be liquidated."
            show={show}
            placement="bottom"
          >
            <Chip bg="red">Liquidated</Chip>
          </Tooltip>
        </Flex>

        <Divider my={3} />

        <Flex flexWrap="wrap" alignItems="flex-end">
          <Box width={[1, 1 / 2]}>
            <Flex alignItems="center" mb={15}>
              <Typography variant="h3" mr={15}>
                Rebalancing
              </Typography>
              <DropdownText text="Past week">
                <MenuList>
                  <MenuItem>Day</MenuItem>
                  <MenuItem>Week</MenuItem>
                  <MenuItem>Month</MenuItem>
                </MenuList>
              </DropdownText>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">0 ICD</Typography>
                <Typography>Collateral sold</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p">0 ICD</Typography>
                <Typography>Loan repaid</Typography>
              </Box>
            </Flex>
          </Box>

          <Box width={[1, 1 / 2]}>
            <Typography>
              Traders can repay loans by selling ICD for $1 of ICX collateral. Your position will rebalance based on
              your % of the total debt.
            </Typography>
          </Box>
        </Flex>
      </BoxPanel>
    </ActivityPanel>
  );
};

export default PositionDetailPanel;
