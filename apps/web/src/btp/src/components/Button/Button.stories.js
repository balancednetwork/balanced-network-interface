import Button from './Button';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const obj = {
  title: 'Components/Button',
  component: Button,
};

export default obj;

const Template = args => (
  <>
    <h3>Primary button with radius</h3>
    <Button width={416} height={64} borderRadius={100} {...args}>
      Connect a Wallet
    </Button>

    <h3>PrimaryButton </h3>
    <PrimaryButton width={416} height={64} {...args}>
      Connect a Wallet
    </PrimaryButton>

    <h3>SecondaryButton</h3>
    <SecondaryButton width={416} height={64} {...args}>
      Connect a Wallet
    </SecondaryButton>
  </>
);

export const Default = Template.bind({});
