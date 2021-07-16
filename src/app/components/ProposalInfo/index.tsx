import React from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import styled from 'styled-components';

import { theme, Typography } from 'app/theme';
import { ReactComponent as CalendarIcon } from 'assets/icons/calendar.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import { normalizeContent } from 'utils';

dayjs.extend(duration);

export default function ProposalInfo(props) {
  const ProposalWrapper = styled.div`
    border-radius: 10px;
    flex: 1;
    width: 100%;
    background: #144a68;
    border: 2px solid #144a68;
    padding: 20px 25px;
    transition: border 0.3s ease;
    outline: none;
    overflow: visible;
    margin: 0 0 25px;
    cursor: pointer;

    :hover,
    :focus {
      border: 2px solid #2ca9b7;
    }
  `;
  const ApprovalSwatch = styled.div`
    margin-right: 7px;
    background: #2ca9b7;
    height: 20px;
    width: 20px;
    border-radius: 5px;
  `;
  const RejectionSwatch = styled.div`
    margin-right: 7px;
    background: #fb6a6a;
    height: 20px;
    width: 20px;
    border-radius: 5px;
  `;
  const Divider = styled.div`
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    margin-bottom: 15px;
  `;
  const ContentText = styled(Typography)`
    color: ${({ theme }) => theme.colors.text2};
    margin-bottom: 15px;
    font-size: 16px;
  `;

  const { title, content, metadata } = props;
  const { voted, voters, approvePercentage, rejectPercentage, timestamp } = metadata;
  const themes = theme();
  return (
    <ProposalWrapper>
      <Typography variant="h3" mb="10px">
        {title}
      </Typography>
      <ContentText>{normalizeContent(content)}</ContentText>
      <Divider />
      <span style={{ display: 'flex', flexDirection: 'row' }}>
        <CalendarIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color={themes.colors.white} mr="20px">
          {`${Math.floor(dayjs.duration(timestamp).asDays())} days, ${
            dayjs.duration(timestamp).asHours() % 24
          } hours left`}
        </Typography>
        <PieChartIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color={themes.colors.white} mr="20px">
          {`${voted} voted`}
        </Typography>
        <UserIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color={themes.colors.white} mr="20px">
          {`${voters} voters`}
        </Typography>
        <span style={{ display: 'flex', flexDirection: 'row' }}>
          <ApprovalSwatch />
          <Typography variant="content" color={themes.colors.white} mr="20px">
            {`${approvePercentage}%`}
          </Typography>
        </span>
        <span style={{ display: 'flex', flexDirection: 'row' }}>
          <RejectionSwatch />
          <Typography variant="content" color={themes.colors.white} mr="20px">
            {`${rejectPercentage}%`}
          </Typography>
        </span>
      </span>
    </ProposalWrapper>
  );
}
