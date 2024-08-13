import Divider from '@/components/Divider';
import CurrencyLogo from '@/components/shared/CurrencyLogo';
import { HIGH_PRICE_ASSET_DP } from '@/constants/tokens';
import { useWithdrawalsFloorStabilityFundData } from '@/queries';
import React, { Fragment } from 'react';
import { Box, Flex } from 'rebass';
import { HeaderText, StyledSkeleton } from '@/sections/TokenSection';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';
import { DashGrid, DataText, MinWidthContainer } from '../CollateralLimits';
import { Token } from '@balancednetwork/sdk-core';
import { useAssetManagerTokens } from '@/queries/assetManager';
import AssetManagerTokenBreakdown from '@/components/AssetManagerTokenBreakdown';

export const SkeletonTokenPlaceholder = () => {
  return (
    <DashGrid my="10px">
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '50px' }}>
            <StyledSkeleton variant="circle" width={40} height={40} />
          </Box>
          <Box ml={2} sx={{ minWidth: '160px' }}>
            <StyledSkeleton width={130} />
            <StyledSkeleton width={70} />
          </Box>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
          <Typography variant="p">
            <StyledSkeleton width={140} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
          <Typography variant="p">
            <StyledSkeleton width={140} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
          <Typography variant="p">
            <StyledSkeleton width={100} />
          </Typography>
        </Flex>
      </DataText>
    </DashGrid>
  );
};

const StabilityFundLimits = () => {
  const { data: withdrawalsFloorData } = useWithdrawalsFloorStabilityFundData();
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();

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
              const tokenBreakdown = assetManagerTokensBreakdown && assetManagerTokensBreakdown[asset.token.address];

              return (
                <Fragment key={index}>
                  <DashGrid my="10px" key={index}>
                    <DataText>
                      <Flex alignItems="center">
                        <Box sx={{ minWidth: '50px' }}>
                          <CurrencyLogo
                            currency={new Token(1, asset.token.address, asset.token.decimals, asset.token.symbol)}
                            size="40px"
                          />
                        </Box>
                        <Box ml={2} sx={{ minWidth: '160px' }}>
                          <Flex>
                            <Typography fontSize={16}>{asset.token.name.replace(' TOKEN', ' Token')}</Typography>
                            {tokenBreakdown && tokenBreakdown.length > 1 && (
                              <AssetManagerTokenBreakdown breakdown={tokenBreakdown} spacing={{ x: 5, y: 0 }} />
                            )}
                          </Flex>
                          <Typography color="text1" fontSize={16}>
                            {asset.token.symbol}
                          </Typography>
                        </Box>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Typography fontSize={16}>{`${asset.current.toFormat(dp)}`}</Typography>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Typography fontSize={16}>{`${asset.floor.toFormat(dp)}`}</Typography>
                      </Flex>
                    </DataText>
                    <DataText>
                      <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
                        <Flex>
                          <Typography fontSize={16}>{`${asset.current.minus(asset.floor).toFormat(dp)}`}</Typography>
                          <Typography
                            ml="10px"
                            color={
                              availableRatio.isGreaterThanOrEqualTo(withdrawalsFloorData.percentageFloor.div(2))
                                ? 'primary'
                                : 'alert'
                            }
                          >
                            {`(~${getFormattedNumber(availableRatio.toNumber(), 'percent0')})`}
                          </Typography>
                        </Flex>
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

export default StabilityFundLimits;
