import React from 'react';

import { Trans } from '@lingui/macro';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { StyledArrowDownIcon, Wrapper } from 'app/components/DropdownText';
import { DataText, List, ListItem } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { PROPOSAL_TYPE, PROPOSAL_TYPE_LABELS } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';

export default function ProposalTypesSelect({
  onSelect,
  selected,
}: {
  onSelect: (type: PROPOSAL_TYPE) => void;
  selected: PROPOSAL_TYPE;
}) {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const ref = React.useRef<HTMLDivElement>(null);

  const handleSelectProposal = (type: PROPOSAL_TYPE) => {
    toggleOpen();
    onSelect(type);
  };

  return (
    <Flex alignItems="flex-end" marginTop="50px" flexWrap="wrap">
      <Typography variant="h2">
        <Trans>Proposal type</Trans>:&nbsp;
      </Typography>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div ref={ref}>
          <StyledWrapper onClick={toggleOpen}>
            <Text active={open}>
              <Trans id={PROPOSAL_TYPE_LABELS[selected].id} />
            </Text>
            <StyledArrowDownIcon />
          </StyledWrapper>

          <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom" offset={[0, 10]}>
            <List style={{ width: '210px', maxHeight: '345px', paddingTop: '10px', paddingBottom: '20px' }}>
              {Object.values(PROPOSAL_TYPE).map(type => (
                <ListItem key={type} small onClick={() => handleSelectProposal(type as PROPOSAL_TYPE)}>
                  <DataText variant="p" fontWeight="bold" small>
                    <Trans id={PROPOSAL_TYPE_LABELS[type].id} />
                  </DataText>
                </ListItem>
              ))}
            </List>
          </PopperWithoutArrow>
        </div>
      </ClickAwayListener>
    </Flex>
  );
}

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  color: #2fccdc;
`;

const Text = styled.span<{ active: boolean }>`
  ${props => props.active && 'color: #2fccdc;'}
  &:hover:after {
    content: '';
    display: 'none';
  }
`;
