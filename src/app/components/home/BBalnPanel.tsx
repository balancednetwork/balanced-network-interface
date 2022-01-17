import React from 'react';

import Nouislider from 'packages/nouislider-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import useWidth from 'hooks/useWidth';

import { BoxPanel } from '../Panel';
import { DropdownPopper } from '../Popover';
import QuestionHelper from '../QuestionHelper';

const ButtonsWrap = styled(Box)`
  margin-left: auto;
`;

const SliderWrap = styled(Box)`
  margin: 25px 0;

  .noUi-horizontal .noUi-connects {
    background: #144a68;
    border-radius: 5px;
  }
`;

const BoostedInfo = styled(Flex)`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
`;

const BoostedBox = styled(Flex)`
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  flex-flow: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  width: 33.333%;

  &:last-of-type {
    border-right: 0;
  }
`;

const StyledTypography = styled(Typography)`
  position: relative;
  padding: 0 20px;
  margin: 0 -20px;

  svg {
    position: absolute;
    right: 0;
    top: 3px;
    cursor: help;
  }
`;

const PoolItem = styled(Flex)`
  min-width: 110px;
  width: 100%;
  max-width: 25%;
  padding: 15px 15px 0 15px;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  @media screen and (max-width: 600px) {
    max-width: 33.333%;
  }

  @media screen and (max-width: 500px) {
    max-width: 50%;
  }

  @media screen and (max-width: 360px) {
    max-width: 100%;
  }
`;

export default function BBalnPanel() {
  const sliderInstance = React.useRef<any>(null);
  const [containerRef, width] = useWidth();
  const [tooltipAnchor, setTooltipAnchor] = React.useState<HTMLElement | null>(null);
  const arrowRef = React.useRef(null);

  const showLPTooltip = () => {
    setTooltipAnchor(containerRef.current);
  };

  const hideLPTooltip = () => {
    setTooltipAnchor(null);
  };

  const handleTooltipToggle = (value?: boolean) => {
    if (value === undefined) {
      tooltipAnchor ? hideLPTooltip() : showLPTooltip();
    } else {
      setTooltipAnchor(value ? containerRef.current : null);
    }
  };

  const handleBoostAdjust = () => {
    handleTooltipToggle();
  };

  return (
    <BoxPanel bg="bg2" flex={1}>
      <Flex alignItems={'flex-end'}>
        <Typography variant="h3">Boost rewards </Typography>
        <Typography padding="0 3px 2px 10px">2,700** bBaln</Typography>
        <QuestionHelper text="Lock BALN to boost your earning potential. The longer you lock it, the more bBALN (boosted BALN) you'll receive, which determines your earning and voting power." />
        <ButtonsWrap>
          <Button fontSize={14} onClick={handleBoostAdjust}>
            Adjust
          </Button>
        </ButtonsWrap>
      </Flex>
      <SliderWrap>
        <Typography>Lock up BALN to boost your earning potential.</Typography>

        <Box margin="10px 0">
          <Nouislider
            disabled={true}
            id="slider-bbaln"
            start={40}
            padding={20}
            connect={[true, false]}
            range={{
              min: [0],
              max: [100],
            }}
            instanceRef={instance => {
              if (instance) {
                sliderInstance.current = instance;
              }
            }}
            // onSlide={onSlide}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Typography>3,000 / 4,000 BALN</Typography>
          <Typography>Locked until 20 Aug 2022</Typography>
        </Flex>
      </SliderWrap>
      <BoostedInfo ref={containerRef}>
        <BoostedBox>
          <Typography fontSize={16} color="#FFF">
            0.03 %
          </Typography>
          <Typography>Network fees</Typography>
        </BoostedBox>
        <BoostedBox>
          <Typography fontSize={16} color="#FFF">
            1.88 x
          </Typography>
          <Typography>Loan rewards</Typography>
        </BoostedBox>
        <BoostedBox>
          <Typography fontSize={16} color="#FFF">
            1.72 x 0 1.85 x
          </Typography>
          <StyledTypography ref={arrowRef}>
            Liquidity rewards <QuestionIcon width={14} onMouseEnter={showLPTooltip} onMouseLeave={hideLPTooltip} />
            <DropdownPopper
              show={Boolean(tooltipAnchor)}
              anchorEl={tooltipAnchor}
              placement="bottom-end"
              offset={[0, 15]}
              customArrowStyle={{
                right: (width ? width : 0) / 6 - 15 + 'px',
                left: 'initial',
                transform: 'translate3d(0,0,0)',
              }}
            >
              <Flex flexWrap="wrap" maxWidth={width} padding="0 15px 15px 15px">
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
                <PoolItem>
                  <Typography fontSize={16} color="#FFF">
                    1.73 x
                  </Typography>
                  <Typography fontSize={14}>bnUSD / sICX</Typography>
                </PoolItem>
              </Flex>
            </DropdownPopper>
          </StyledTypography>
        </BoostedBox>
      </BoostedInfo>
    </BoxPanel>
  );
}
