import React, { memo } from 'react';

import closeIcon from 'btp/src/assets/images/close-icon.svg';
import checkIcon from 'btp/src/assets/images/green-checked-icon.svg';
import exclamationPointIcon from 'btp/src/assets/images/orange-exclamation-point-icon.svg';
import xIcon from 'btp/src/assets/images/red-x-icon.svg';
import { PrimaryButton } from 'btp/src/components/Button';
import { Loader } from 'btp/src/components/Loader';
import { colors } from 'btp/src/components/Styles/Colors';
import { media } from 'btp/src/components/Styles/Media';
import { HeaderMixin } from 'btp/src/components/Typography/Header';
import { TextMixin } from 'btp/src/components/Typography/Text';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const Wapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: ${({ isShowed }) => (isShowed ? 'grid' : 'none')};
  place-items: center;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 105;

  background-color: rgba(10, 9, 11, 0.2);
  backdrop-filter: blur(20px);
`;

const Content = styled.div`
  width: ${({ width }) => width};
  margin-top: ${({ marginTop }) => marginTop};
  padding: 23px 32px 32px;
  word-break: break-word;

  display: flex;
  flex-direction: column;

  background-color: ${colors.grayBG};
  border-radius: 4px;

  .heading {
    display: flex;
    position: relative;
    margin-bottom: 10px;
    padding: 0 !important;
    height: 36px;

    h3.title {
      flex: 1;
      margin-bottom: 0;

      text-align: center;
      ${HeaderMixin.smBold};
    }

    .close-btn {
      background: url('${closeIcon}');
      width: 18px;
      height: 18px;

      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      border: none;
    }
  }

  .content {
    flex: 1;
    text-align: center;

    img.icon {
      width: 91.67px;
      height: 91.67px;
    }

    p.desc {
      max-width: 392px;
      margin: 22.17px auto 0;
      text-align: center;
      ${TextMixin.md}
    }
  }

  ${media.md`
    width: 100%;
    overflow: auto;
  `}
`;

const StyledButton = styled(PrimaryButton)`
  width: 100%;
  margin-top: 42px;
`;

const Icon = ({ icon }) => <img alt="icon" src={icon} className="icon" />;

const icons = {
  checkIcon: <Icon icon={checkIcon} />,
  xIcon: <Icon icon={xIcon} />,
  exclamationPointIcon: <Icon icon={exclamationPointIcon} />,
  loader: <Loader />,
};

export const Modal = memo(
  ({
    icon,
    title,
    desc,
    button = {},
    width = '480px',
    children,
    display,
    marginTop = '0px',
    setDisplay = () => {},
    hasClosedBtn = true,
    hasHeading = true,
  }) => {
    const iconURL = icons[icon];
    const { text, ...others } = button;

    return (
      <Wapper isShowed={display}>
        <Content width={width} marginTop={marginTop}>
          {hasHeading && (
            <div className="heading">
              {title && <h3 className="title">{title}</h3>}
              {hasClosedBtn && <button className="close-btn" onClick={() => setDisplay(false)}></button>}
            </div>
          )}
          <div className="content">
            {iconURL && iconURL}
            {desc && <p className="desc">{desc}</p>}
            {children}
          </div>
          {text && (
            <StyledButton height={64} {...others}>
              {text}
            </StyledButton>
          )}
        </Content>
      </Wapper>
    );
  },
);

Modal.displayName = 'Modal';

Modal.propTypes = {
  /** Display a available icon */
  icon: PropTypes.oneOf(['checkIcon', 'xIcon', 'exclamationPointIcon', 'loader']),
  /** Display title */
  title: PropTypes.string,
  /** Display description */
  desc: PropTypes.string,
  /** Display a button with text and actions */
  button: PropTypes.object,
  /** Width */
  width: PropTypes.string,
  /** Display or not */
  display: PropTypes.bool,
  /** Margin-top */
  marginTop: PropTypes.string,
  /** Toggle display */
  setDisplay: PropTypes.func,
  /** Display close button or not */
  hasClosedBtn: PropTypes.bool,
  /** Display heading or not */
  hasHeading: PropTypes.bool,
};
