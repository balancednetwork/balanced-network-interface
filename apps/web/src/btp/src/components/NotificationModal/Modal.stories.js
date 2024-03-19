import { FailedBidContent } from './FailedBidContent';
import { Modal } from './Modal';

const obj = {
  title: 'Components/Notification Modal',
  component: Modal,
};

export default obj;

const SuccessTemplate = args => (
  <Modal
    icon="checkIcon"
    desc="Your transaction was submitted successfully."
    button={{ text: 'Continue transfer' }}
    display
    {...args}
  />
);

const FailureTemplate = args => (
  <Modal
    icon="xIcon"
    desc="Your transaction has failed. Please go back and try again."
    button={{ text: 'Back to transfer' }}
    display
    {...args}
  />
);

const FailedBidTemplate = args => (
  <Modal icon="xIcon" button={{ text: 'Try again' }} display {...args}>
    <FailedBidContent />
  </Modal>
);

const WaitingTemplate = () => (
  <Modal icon="loader" desc="Waiting for confirmation in your wallet." width="325px" display />
);

export const Success = SuccessTemplate.bind({});
export const Failure = FailureTemplate.bind({});
export const FailureBid = FailedBidTemplate.bind({});
export const Waiting = WaitingTemplate.bind({});
