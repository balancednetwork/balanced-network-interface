import React, { useEffect } from 'react';

import { Wrapper, RatioValue, ListBox } from 'app/components/newproposal/RatioInput';

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
  }, [proposalType]);

  return (
    <Wrapper>
      {ratioValues && <ListBox title="Current" list={ratioValues} />}
      {proposedList && <ListBox title="Proposed" list={proposedList} />}
    </Wrapper>
  );
}
