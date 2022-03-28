import { PrimaryButton, SecondaryButton } from 'components/Button';
import { media } from 'components/Styles/Media';
import { Text } from 'components/Typography';
import styled from 'styled-components/macro';

const Wrapper = styled.div`
  padding-top: 3px;

  > .button-control {
    margin-top: 42px;

    .cancel-btn {
      margin-right: 32px;
    }

    ${media.md`
      display: flex;
      align-items: center;
      flex-direction: column-reverse;

      .cancel-btn {
        margin: 20px 0 0;
      }
    `}
  }
`;

export const TransferApproval = ({ onOk, onCancel }) => {
  return (
    <Wrapper>
      <Text className="md">
        In case you granted your permission, please wait until it has been confirmed. Or, you need to grant permission
        before sending none-native coins once and only first. Proceed?
      </Text>
      <div className="button-control">
        <SecondaryButton width={192} height={64} className="cancel-btn" onClick={onCancel}>
          Cancel
        </SecondaryButton>
        <PrimaryButton width={192} height={64} onClick={onOk}>
          OK
        </PrimaryButton>
      </div>
    </Wrapper>
  );
};
