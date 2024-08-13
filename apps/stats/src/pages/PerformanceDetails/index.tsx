import React from 'react';

import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

import Breadcrumbs, { BreadcrumbItem } from '@/components/Breadcrumbs';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Container, Divider } from '@/pages/StatsPage';
import { Typography } from '@/theme';

// import BBALNSection from './sections/BBALNSection';
import EarningsSection from './sections/EarningSection';
import HoldingsSection from './sections/HoldingsSection';
import StabilityFundSection from './sections/StabilityFundSection';
import { useLocation } from 'react-router-dom';

export const GridItem = styled.div`
  text-align: right;
  &:nth-of-type(3n + 1) {
    text-align: left;
  }
`;

export const ScrollHelper = styled.div`
  max-width: 100;
  overflow-x: auto;
`;

export const GridItemHeader = styled(GridItem)`
  text-transform: uppercase;
  font-size: 14px;
  font-weight: normal;
  letter-spacing: 3px;
  color: #ffffff;
  padding: 25px 0 20px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: end;
  &:nth-of-type(3n + 1) {
    justify-content: start;
  }
`;

export const GridItemStrong = styled(GridItem)`
  padding-bottom: 10px;
  font-weight: 700;
  color: #ffffff;

  &:nth-of-type(3n + 1) {
    padding-left: 25px;
  }
`;

export const GridItemLight = styled(GridItem)`
  padding-bottom: 15px;

  &:nth-of-type(3n + 1) {
    padding-left: 50px;
  }
`;

export const GridItemSubtotal = styled(GridItemStrong)`
  border-top: 1px solid #304a68;
  border-bottom: 1px solid #304a68;
  padding-top: 9px;

  &:nth-of-type(3n + 1) {
    padding-left: 0;
  }
`;

export const GridItemTotal = styled(GridItemSubtotal)`
  border-bottom: 0;
`;

export const GridItemToken = styled(GridItem)`
  padding: 20px 0;
`;

export const GridItemAssetTotal = styled(GridItemTotal)`
  border-top: 0;
  padding-top: 20px;
`;

export const TextWithArrow = styled.span`
  color: #2fccdc;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  &:after {
    content: '';
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 7px solid #2fccdc;
    display: inline-flex;
    margin-left: 6px;
    margin-top: 3px;
  }
`;

export function PerformanceDetails() {
  const breadcrumbsItems: BreadcrumbItem[] = [{ displayName: 'Performance details' }];
  const location = useLocation();

  React.useEffect(() => {
    const elementId = location.hash.substring(1);

    if (elementId) {
      const scrollToElement = () => {
        const element = document.getElementById(elementId);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // If the element doesn't exist yet, try again after a short delay
          setTimeout(scrollToElement, 1000);
        }
      };

      scrollToElement();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <Container>
      <Helmet>
        <title>Performance details | Balanced</title>
      </Helmet>

      <Header />

      <Breadcrumbs items={breadcrumbsItems} />

      <Typography fontWeight="bold" fontSize={[32, 45, 60]} color="#fff">
        Performance details
      </Typography>
      <Typography fontSize="18px" lineHeight="32px" maxWidth="600px">
        Track Balanced's performance over time. All $ values are in USD, based on the current price of each asset.
      </Typography>

      <EarningsSection />

      <HoldingsSection />
      {/* 
      <BBALNSection /> */}

      <StabilityFundSection />

      <Divider />
      <Footer />
    </Container>
  );
}
