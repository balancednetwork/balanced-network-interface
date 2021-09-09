import React, { useEffect } from 'react';

import { BoxPanel, Wrapper, List, ListItem, RatioValue } from 'app/components/newproposal/RatioInput';
import { Typography } from 'app/theme';

import { PROPOSAL_CONFIG } from '../NewProposalPage/constant';

interface RatioProps {
  proposalType: string;
  proposedList: [];
}

export default function Ratio({ proposalType, proposedList }: RatioProps) {
  const [ratioValues, setRatioValues] = React.useState<Array<RatioValue> | undefined>();

  useEffect(() => {
    (async () => {
      const result = await PROPOSAL_CONFIG[proposalType].fetchInputData();

      setRatioValues(result);
    })();
  }, []);

  return (
    <Wrapper>
      {ratioValues && (
        <BoxPanel width={1 / 2}>
          <Typography variant="p" textAlign="center" marginBottom="9px">
            Current
          </Typography>
          <List>
            {ratioValues.map(({ name, percent }) => (
              <ListItem key={name + percent} hasTitle={!!name}>
                {name && <Typography variant="p">{name}</Typography>}
                <Typography variant="h2">{percent}%</Typography>
              </ListItem>
            ))}
          </List>
        </BoxPanel>
      )}
      {proposedList && (
        <BoxPanel width={1 / 2}>
          <Typography variant="p" textAlign="center" marginBottom="9px">
            Proposed
          </Typography>
          <List>
            {proposedList.map(({ name, percent }) => (
              <ListItem key={name + percent} hasTitle={!!name}>
                {name && <Typography variant="p">{name}</Typography>}
                <Typography variant="h2">{percent}%</Typography>
              </ListItem>
            ))}
          </List>
        </BoxPanel>
      )}
    </Wrapper>
  );
}
