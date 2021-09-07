import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { StyledArrowDownIcon, Wrapper } from 'app/components/DropdownText';
import { DataText, List, ListItem } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { PROPOSAL_CONFIG } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';
import { useProposalType, useSetProposalType } from 'store/proposal/hooks';

export default function ProposalTypesSelect() {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const setProposalType = useSetProposalType();
  const selectedProposalType = useProposalType();

  const handleSelectProposal = (type: string) => {
    toggleOpen();
    setProposalType(type);
  };

  return (
    <Flex alignItems="flex-end" marginTop="50px">
      <Typography variant="h2">Proposal type:&nbsp;</Typography>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div ref={ref}>
          <StyledWrapper onClick={toggleOpen}>
            <Text active={open}>{selectedProposalType}</Text>
            <StyledArrowDownIcon />
          </StyledWrapper>

          <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom" offset={[0, 10]}>
            <List style={{ width: '210px', paddingTop: '10px', paddingBottom: '20px' }}>
              {Object.keys(PROPOSAL_CONFIG).map(type => (
                <ListItem key={type} small onClick={() => handleSelectProposal(type)}>
                  <DataText variant="p" fontWeight="bold" small>
                    {type}
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
