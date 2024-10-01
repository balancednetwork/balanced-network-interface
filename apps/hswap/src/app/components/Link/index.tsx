import styled from 'styled-components';

export const Link = styled.a<{ noBorder?: boolean; fontSize?: string }>`
  color: #2fccdc;
  font-size: ${props => props.fontSize ?? '14px'};
  text-decoration: none;
  background: transparent;
  display: inline-block;
  position: relative;
  padding-bottom: 3px;
  margin-bottom: -9px;
  cursor: pointer;

  &:after {
    content: '';
    display: block;
    width: 0px;
    height: 1px;
    margin-top: 3px;
    background: transparent;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  &:hover:after {
    width: 100%;
    background: ${props => (props.noBorder ? 'transparent' : '#2fccdc')};
  }
`;
