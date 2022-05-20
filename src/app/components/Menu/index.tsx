import React from 'react';

import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { LOCALE_LABEL, SupportedLocale } from 'constants/locales';
import { useLocationLinkProps } from 'hooks/useLocationLinkProps';

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
    background-color: ${({ theme }) => theme.colors.primary};
    transition: background-color 0.2s ease;
  }
`;

const InternalMenuItem = styled(Link)`
  padding: 10px 15px;
  transition: background-color 0.3s ease;
  color: ${({ theme }) => theme.colors.white};

  :hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.primary};
    transition: background-color 0.2s ease;
  }
`;

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
    text-decoration: none;
  }
`;

export function LanguageMenuItem({
  locale,
  active,
  onClick: onPropsClick,
}: {
  locale: SupportedLocale;
  active: boolean;
  onClick?: () => void;
}) {
  const { to, onClick } = useLocationLinkProps(locale);

  if (!to) return null;

  return (
    <InternalLinkMenuItem
      onClick={() => {
        onPropsClick && onPropsClick();
        onClick && onClick();
      }}
      to={to}
    >
      <li>{LOCALE_LABEL[locale]}</li>
      {/* {active && <Check opacity={0.6} size={16} />} */}
    </InternalLinkMenuItem>
  );
}
