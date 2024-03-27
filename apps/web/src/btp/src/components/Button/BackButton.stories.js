import { BackButton } from './BackButton';

const obj = {
  title: 'Components/Button/Variants',
  component: BackButton,
  parameters: {
    backgrounds: {
      default: 'default',
      values: [{ name: 'default', value: '#000' }],
    },
  },
};

export default obj;

const Template = args => <BackButton {...args}>Transfer history</BackButton>;

export const BackButtonPreview = Template.bind({});
