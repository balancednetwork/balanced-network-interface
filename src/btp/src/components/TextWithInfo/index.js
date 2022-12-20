import { colors } from 'components/Styles/Colors';
import { Tooltip } from 'components/Tooltip';
import { SubTitle } from 'components/Typography';
import styled from 'styled-components/macro';

import infoIcon from 'assets/images/info-icon.svg';

const StyledHeading = styled(SubTitle)`
  color: ${colors.grayScaleSubText};
  display: inline-flex;
  margin-bottom: 10px;

  img {
    padding-left: 8.67px;
  }
  .icon-with-tooltip {
    display: flex;
    align-items: center;
  }
  .icon-with-tooltip:hover .left,
  .icon-with-tooltip:hover .bottom {
    display: initial;
  }
  .left {
    display: none;
    margin-left: 38.42px;
  }
  .bottom {
    display: none;
    margin-bottom: 100px;
    margin-left: -77px;
  }
`;

export const TextWithInfo = ({ children, className, tooltip, width, direction = 'left' }) => {
  return (
    <StyledHeading className={`sm bold ${className}`}>
      {children}
      {tooltip && (
        <div className="icon-with-tooltip">
          <img src={infoIcon} alt="icon" />
          <Tooltip width={width} direction={direction}>
            {tooltip}
          </Tooltip>
        </div>
      )}
    </StyledHeading>
  );
};
