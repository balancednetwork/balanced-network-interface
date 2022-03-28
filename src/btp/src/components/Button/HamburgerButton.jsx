import React from 'react';

import styled from 'styled-components/macro';

import { colors } from '../Styles/Colors';

const Wrapper = styled.ul`
  position: relative;
  width: 25px;
  height: 25px;
  cursor: pointer;

  li {
    list-style: none;
    position: absolute;
    background: ${colors.primaryBrandLight};
    width: 100%;
    height: 3px;
    transform: translateY(-50%);
    transition: 0.3s;
  }
  li:nth-of-type(1) {
    top: 20%;
  }
  li:nth-of-type(2) {
    top: 50%;
  }
  li:nth-of-type(3),
  li:nth-of-type(4) {
    width: 50%;
    top: 80%;
  }
  li:nth-of-type(1),
  li:nth-of-type(2),
  li:nth-of-type(3) {
    left: 0;
  }
  li:nth-of-type(4) {
    right: 0;
  }

  &.active li:nth-of-type(1) {
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }
  &.active li:nth-of-type(2) {
    top: 50%;
    transform: translateY(-50%) rotate(-45deg);
  }
  &.active li:nth-of-type(3) {
    left: -50%;
    opacity: 0;
  }
  &.active li:nth-of-type(4) {
    right: -50%;
    opacity: 0;
  }
`;

export const HamburgerButton = props => (
  <Wrapper {...props}>
    <li></li>
    <li></li>
    <li></li>
    <li></li>
  </Wrapper>
);
