import React from 'react';

import { Link } from 'react-router-dom';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';

interface BreadcrumbProps {
  title: string;
  locationText: string;
  locationPath: string;
}

const BreadcrumbRow = styled(Flex)`
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
`;

const BreadcrumbLink = styled(Link)`
  text-decoration: none;
`;

const LocationText = styled(Typography)`
  color: ${({ theme }) => theme.colors.primaryBright};
  border-bottom: 1px solid ${({ theme }) => theme.colors.bg1};
  padding-bottom: 5px;
  :hover,
  :focus {
    padding-bottom: 5px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.primaryBright};
  }
`;

export function Breadcrumb(props: BreadcrumbProps) {
  const { title, locationText, locationPath } = props;

  return (
    <BreadcrumbRow>
      <BreadcrumbLink to={{ pathname: locationPath }}>
        <LocationText variant="p">{locationText}</LocationText>
      </BreadcrumbLink>
      <Typography variant="p" mr="10px" ml="10px">
        {'>'}
      </Typography>
      <Typography variant="p">{title}</Typography>
    </BreadcrumbRow>
  );
}
