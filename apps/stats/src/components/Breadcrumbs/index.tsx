import React from 'react';

import { Link } from 'react-router-dom';
import { Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

export interface BreadcrumbItem {
  displayName: string;
  link?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const BreadcrumbsWrap = styled(Flex)`
  padding: 40px 0 50px;
  font-size: 20px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
  `}
`;

const BreadcrumbsLink = styled(Link)`
  text-decoration: none;
  position: relative;
  color: #2fccdc;
  padding-bottom: 3px;
  margin-bottom: -9px;
  &:hover {
    &:after {
      width: 100%;
    }
  }
  &:after {
    content: '';
    display: block;
    height: 3px;
    margin-top: 3px;
    background-image: linear-gradient(120deg, #2ca9b7, #1b648f);
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
    width: 0;
  }
`;

const BreadcrumbsSeparator = styled(Text)`
  color: #fff;
  font-size: 16px;
  line-height: 26px;
  padding: 0 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
    line-height: 18px;
  `}
`;

const BreadcrumbsCurrent = styled(Text)`
  color: #fff;
`;

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <BreadcrumbsWrap>
      <BreadcrumbsLink to="/">Stats</BreadcrumbsLink>
      <BreadcrumbsSeparator>{'>'}</BreadcrumbsSeparator>
      {items.map((item, idx) => {
        return idx + 1 === items.length ? (
          <BreadcrumbsCurrent key={idx}>{item.displayName}</BreadcrumbsCurrent>
        ) : (
          <>
            <BreadcrumbsLink key={idx} to={item.link ? item.link : '/'}>
              {item.displayName}
            </BreadcrumbsLink>
            <BreadcrumbsSeparator key={'separator' + idx}>{'>'}</BreadcrumbsSeparator>
          </>
        );
      })}
    </BreadcrumbsWrap>
  );
};

export default Breadcrumbs;
