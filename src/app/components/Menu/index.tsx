import styled from 'styled-components';

export const MenuList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0;
  font-size: 14px;
  user-select: none;
`;

export const MenuItem = styled.li`
  padding: 10px 15px;
  transition: background-color 0.3s ease;

  :hover {
    cursor: pointer;
    background-color: #2ca9b7;
    transition: background-color 0.2s ease;
  }
`;
