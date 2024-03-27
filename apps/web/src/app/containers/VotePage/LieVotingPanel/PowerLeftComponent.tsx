import React from 'react';

import { Trans } from '@lingui/macro';

import { UnderlineText } from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { useBBalnAmount } from 'store/bbaln/hooks';
import {
  useChangeInputValue,
  useEditState,
  useEditValidation,
  usePowerLeft,
  useUserVoteData,
} from 'store/liveVoting/hooks';

import { formatFraction } from '../utils';

export default function PowerLeftComponent() {
  const powerLeft = usePowerLeft();
  const isInputValid = useEditValidation();
  const changeInput = useChangeInputValue();
  const userVoteData = useUserVoteData();
  const { editing } = useEditState();
  const bBalnAmount = useBBalnAmount();

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
      {bBalnAmount.isGreaterThan(0) && powerLeft && (
        <Typography fontSize={14} mt={2}>
          <Trans>
            Voting power available:{' '}
            {editing ? (
              <UnderlineText onClick={handleInputFill}>
                <strong
                  className={isInputValid ? '' : 'error-anim'}
                  style={{
                    color: isInputValid ? '#2fccdc' : '#fb6a6a',
                    transition: 'all ease 0.3s',
                    cursor: 'pointer',
                  }}
                >
                  {formatFraction(powerLeft)}
                </strong>
              </UnderlineText>
            ) : (
              <strong style={{ color: '#FFFFFF' }}>{formatFraction(powerLeft)}</strong>
            )}
          </Trans>
        </Typography>
      )}
    </>
  );
}
