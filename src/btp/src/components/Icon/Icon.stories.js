import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components/macro';

import { Icon } from './Icon';

const obj = {
  title: 'Components/Icon',
  component: Icon,
};

export default obj;

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;

  > .item {
    padding: 20px 0;

    > h3 {
      margin-bottom: 10px;
      cursor: pointer;

      :active {
        color: #00000054;
      }
    }

    > img {
      max-width: 50px;
      max-height: 50px;
    }
  }
`;

const req = require.context('../../../src/assets/images', true, /\.svg|png|jpeg?$/);
const Template = () => (
  <Wrapper>
    {req.keys().map((filename, idx) => {
      const name = filename.replace(/.\//, '');
      return (
        <div className="item" key={filename}>
          <CopyToClipboard text={"import icon from 'assets/images/" + name + "'"}>
            <h3 title="click to copy">
              {idx + 1}. {name}
            </h3>
          </CopyToClipboard>
          <Icon iconURL={req(filename)} />
        </div>
      );
    })}
  </Wrapper>
);

export const Default = Template.bind({});
