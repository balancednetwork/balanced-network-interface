import React from 'react';

import Nouislider from 'packages/nouislider-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

import { BoxPanel } from '../Panel';
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
  flex-grow: 1;

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

export default function BBalnPanel() {
  const sliderInstance = React.useRef<any>(null);

  return (
    <BoxPanel bg="bg2" flex={1}>
      <Flex alignItems={'flex-end'}>
        <Typography variant="h3">Boost rewards </Typography>
        <Typography padding="0 3px 2px 10px">2,700** bBaln</Typography>
        <QuestionHelper text="Lock BALN to boost your earning potential. The longer you lock it, the more bBALN (boosted BALN) you'll receive, which determines your earning and voting power." />
        <ButtonsWrap>
          <Button fontSize={14}>Adjust</Button>
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
      <BoostedInfo>
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
          <StyledTypography>
            Liquidity rewards <QuestionIcon width={14} />
          </StyledTypography>
        </BoostedBox>
      </BoostedInfo>
    </BoxPanel>
  );
}
