import React from 'react';

import { createPortal } from 'react-dom';
import { ToastContainer } from 'react-toastify';
import { useMedia } from 'react-use';
import styled from 'styled-components';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContainer = () => {
  const isSmallDevice = useMedia('(max-width: 999px)');

  return typeof document !== 'undefined'
    ? createPortal(
        <StyledToastContainer
          autoClose={false}
          position={isSmallDevice ? 'top-center' : 'bottom-right'}
          closeOnClick={false}
        />,
        document.body,
      )
    : null;
};

const StyledToastContainer = styled(ToastContainer)`
  &.Toastify__toast-container {
  }
  .Toastify__toast {
    background-color: ${({ theme }) => theme.colors.bg2};
    border: 1px solid ${({ theme }) => theme.colors.primary};
    border-radius: 10px;
    overflow: hidden;

    color: ${props => props.theme.colors.white};
  }
  .Toastify__toast-body {
    font-family: 'tex-gyre-adventor';
    margin: 5px 10px;
  }
  .Toastify__progress-bar {
    background: ${props => props.theme.colors.primary};
  }
  .Toastify__close-button > svg {
    fill: white;
    height: 24px;
    width: 24px;
  }
`;

export default NotificationContainer;
