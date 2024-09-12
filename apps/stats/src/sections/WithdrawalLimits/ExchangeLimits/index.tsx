import Divider from '@/components/Divider';
import { CurrencyLogoFromURI } from '@/components/shared/CurrencyLogo';
import { HIGH_PRICE_ASSET_DP } from '@/constants/tokens';
import { useWithdrawalsFloorDEXData } from '@/queries';
import { HeaderText } from '@/sections/TokenSection';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';
import React, { Fragment } from 'react';
import { Box, Flex } from 'rebass';
import { DashGrid, DataText, MinWidthContainer, SkeletonTokenPlaceholder } from '../CollateralLimits';

const ExchangeLimits = () => {
  const { data: withdrawalsFloorData } = useWithdrawalsFloorDEXData();

  return (
    <Box overflow="auto">
      <MinWidthContainer>
        <DashGrid>
          <HeaderText>Asset</HeaderText>
          <HeaderText>Liquidity</HeaderText>
          <HeaderText>Security floor</HeaderText>
          <HeaderText>Available to withdraw</HeaderText>
        </DashGrid>
        {withdrawalsFloorData ? (
          <>
            {withdrawalsFloorData?.assetFloorData.map((asset, index) => {
              const isLast = index === withdrawalsFloorData.assetFloorData.length - 1;
              const dp = HIGH_PRICE_ASSET_DP[asset.token.address] || 0;
              const availableRatio = asset.current.minus(asset.floor).div(asset.current);

              return (
                <Fragment key={index}>
                  <DashGrid my="10px" key={index}>
                    <DataText>
                      <Flex alignItems="center">
                        <Box sx={{ minWidth: '50px' }}>
                          <CurrencyLogoFromURI address={asset.token.address} size="40px" />
                        </Box>
                        <Box ml={2} sx={{ minWidth: '160px' }}>
                          <Typography fontSize={16}>{asset.token.name.replace(' TOKEN', ' Token')}</Typography>
                          <Typography color="text1" fontSize={16}>
                            {asset.token.symbol}
                          </Typography>
                        </Box>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Typography fontSize={16}>{`$${asset.current
                          .times(asset.token.price)
                          .toFormat(0)}`}</Typography>
                        <Typography color="text1">{`${asset.current.toFormat(dp)} ${asset.token.symbol}`}</Typography>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Typography fontSize={16}>{`$${asset.floor.times(asset.token.price).toFormat(0)}`}</Typography>
                        <Typography color="text1">{`${asset.floor.toFormat(dp)} ${asset.token.symbol}`}</Typography>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Flex>
                          <Typography fontSize={16}>{`$${asset.current
                            .minus(asset.floor)
                            .times(asset.token.price)
                            .toFormat(0)}`}</Typography>
                          <Typography
                            ml="10px"
                            color={
                              availableRatio.isGreaterThanOrEqualTo(asset.percentageFloor.div(2)) ? 'primary' : 'alert'
                            }
                          >
                            {`(~${getFormattedNumber(availableRatio.toNumber(), 'percent0')})`}
                          </Typography>
                        </Flex>
                        <Typography color="text1">
                          {`${asset.current.minus(asset.floor).toFormat(dp)} ${asset.token.symbol}`}
                        </Typography>
                      </Flex>
                    </DataText>
                  </DashGrid>

                  {!isLast && <Divider />}
                </Fragment>
              );
            })}
          </>
        ) : (
          <>
            <SkeletonTokenPlaceholder />
            <Divider />
            <SkeletonTokenPlaceholder />
            <Divider />
            <SkeletonTokenPlaceholder />
          </>
        )}
      </MinWidthContainer>
    </Box>
  );
};

export default ExchangeLimits;
