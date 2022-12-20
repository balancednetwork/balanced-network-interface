import { TextInput } from './TextInput';
import { TokenInput } from './TokenInput';

const obj = {
  title: 'Components/Input',
  component: TextInput,
};

export default obj;

const TextInputTemplate = args => <TextInput placeholder="Enter a ETH address" {...args} />;
const TokenInputTemplate = args => <TokenInput placeholder="0 ETH" {...args} />;

export const Text = TextInputTemplate.bind({});
export const Token = TokenInputTemplate.bind({});
