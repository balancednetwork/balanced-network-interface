import React, { useEffect } from 'react';

import { t } from '@lingui/macro';

import { Wrapper, RatioValue, ListBox } from 'app/components/newproposal/RatioInput';

import { PROPOSAL_CONFIG } from '../NewProposalPage/constant';

interface RatioProps {
  proposalStatus?: string;
  proposalType: string;
  proposedList: [];
}

export default function Ratio({ proposalStatus, proposalType, proposedList }: RatioProps) {
  const [ratioValues, setRatioValues] = React.useState<Array<RatioValue> | undefined>();
  const isExecuted = proposalStatus === 'Executed';

  useEffect(() => {
    (async () => {
      const result = await PROPOSAL_CONFIG[proposalType].fetchInputData();

      setRatioValues(result);
    })();
  }, [proposalType]);

  return (
    <Wrapper>
      {ratioValues && <ListBox title={t`Current`} list={ratioValues} hidden={isExecuted} />}
      {proposedList && <ListBox title={t`Proposed`} list={proposedList} />}
    </Wrapper>
  );
}
