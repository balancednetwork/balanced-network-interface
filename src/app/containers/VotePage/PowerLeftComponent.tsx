import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';

import { Typography } from 'app/theme';
import {
  useChangeInputValue,
  useEditState,
  useEditValidation,
  usePowerLeft,
  useUserVoteData,
} from 'store/liveVoting/hooks';

import { formatFraction } from './utils';

export default function PowerLeftComponent() {
  const { account } = useIconReact();
  const powerLeft = usePowerLeft();
  const isInputValid = useEditValidation();
  const changeInput = useChangeInputValue();
  const userVoteData = useUserVoteData();
  const { editing } = useEditState();

  const handleInputFill = () => {
    if (powerLeft) {
      if (userVoteData && userVoteData[editing]) {
        changeInput(formatFraction(powerLeft.add(userVoteData[editing].power), ''));
      } else {
        changeInput(formatFraction(powerLeft, ''));
      }
    }
  };

  return (
    <>
      {account && powerLeft && (
        <Typography fontSize={14}>
          <Trans>
            Voting power available:{' '}
            <strong
              className={isInputValid ? '' : 'error-anim'}
              style={{ color: isInputValid ? '#FFFFFF' : '#fb6a6a', transition: 'all ease 0.3s', cursor: 'pointer' }}
              onClick={handleInputFill}
            >
              {formatFraction(powerLeft)}
            </strong>
          </Trans>
        </Typography>
      )}
    </>
  );
}
