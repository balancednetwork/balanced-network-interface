import styled from 'styled-components';

import SearchIcon from 'assets/icons/search.svg';

export const SearchInput = styled.input`
  background-image: url(${SearchIcon});
  background-repeat: no-repeat;
  background-size: 18px;
  background-position: 15px 10px;

  position: relative;
  display: flex;
  padding: 3px 20px 3px 45px;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.colors.bg5};
  border: none;
  outline: none;
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text};
  border-style: solid;
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  -webkit-appearance: none;
  transition: border 0.3s ease;
  font-size: 16px;

  ::placeholder {
    color: rgba(255, 255, 255, 0.75);
    opacity: 1;
  }

  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }

  :hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

export default SearchInput;
