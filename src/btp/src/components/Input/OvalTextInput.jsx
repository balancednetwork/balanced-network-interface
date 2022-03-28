import styled from 'styled-components/macro';

import { TextInput } from './TextInput';

const Wrapper = styled.div`
  position: relative;

  & > input {
    padding: 11px 52px 11px 16px;
    width: 373px;
    border-radius: 100px 0 0 100px;
  }

  &:after {
    content: '';
    position: absolute;
    top: 50%;
    right: 17.79px;
    display: ${({ icon }) => (icon ? 'block' : 'none')};

    width: 17.38px;
    height: 17.38px;
    transform: translateY(-50%);
    background: transparent center / contain no-repeat url('${({ icon }) => icon}');
  }
`;

export const OvalTextInput = ({ icon, ...props }) => {
  return (
    <Wrapper>
      <TextInput placeholder="Search auction by name" {...props} icon={icon} />
    </Wrapper>
  );
};
