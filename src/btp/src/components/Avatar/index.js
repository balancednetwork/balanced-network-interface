import React from 'react';

import defaultAvatar from 'btp/src/assets/images/avatar.svg';
import styled from 'styled-components/macro';

const Wapper = styled.img`
  ${({ size }) => `
    width: ${size}px;
    height: ${size}px;
    `}
`;

export const Avatar = ({ src = defaultAvatar, size = 20, ...props }) => {
  return <Wapper src={src} size={size} alt="avatar" {...props} />;
};
