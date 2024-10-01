import styled from 'styled-components';

const SearchIcon =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="matrix(1,0,0,1,-2,-2)"><circle cx="10.5" cy="10.5" r="7.5" style="fill:none;stroke:rgb(128,133,151);stroke-width:2px;"/></g><g transform="matrix(1,0,0,1,-2,-2)"><path d="M21,21L15.8,15.8" style="fill:none;fill-rule:nonzero;stroke:rgb(128,133,151);stroke-width:2px;"/></g></svg>';

export const SearchInput = styled.input`
  background-image: url('${SearchIcon}');
  background-repeat: no-repeat;
  background-size: 20px;
  background-position: 15px 10px;

  position: relative;
  display: flex;
  padding: 3px 20px 3px 45px;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.colors?.bg5};
  border: none;
  outline: none;
  border-radius: 10px;
  color: ${({ theme }) => theme.colors?.text};
  border-style: solid;
  border: 2px solid ${({ theme }) => theme.colors?.bg5};
  -webkit-appearance: none;
  transition: border 0.3s ease;
  font-size: 14px;

  ::placeholder {
    color: rgba(255, 255, 255, 0.75);
    opacity: 1;
  }

  &:focus {
    border: 2px solid ${({ theme }) => theme.colors?.primary};
    outline: none;
  }

  &:hover {
    border: 2px solid ${({ theme }) => theme.colors?.primary};
    outline: none;
  }
`;

export default SearchInput;
