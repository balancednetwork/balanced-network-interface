import styled from 'styled-components';

const SocialButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 2px solid #0c2a4d;
  background-color: #0c2a4d;
  border-radius: 50%;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
  &:hover {
    border: 2px solid #1a6f88;
    background-color: #2ca9b7;
    box-shadow: 0 0 0 10px rgb(44 169 183 / 50%), inset 0 0 0 0 #2ca9b7, 0 0 5px 2px #2ca9b7;
  }
`;
export default SocialButton;
