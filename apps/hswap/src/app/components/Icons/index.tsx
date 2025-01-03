import React from 'react';

import AllChainGradientIcon from '@/assets/icons2/all-chain-gradient.svg';
import AllChainWhiteIcon from '@/assets/icons2/all-chain-white.svg';
import AllChainIcon from '@/assets/icons2/all-chain.svg';

import ArrowGradientIcon from '@/assets/icons2/arrow-gradient.svg';
import ArrowWhiteIcon from '@/assets/icons2/arrow-white.svg';
const ArrowIcon: React.FC<React.ComponentProps<'svg'>> = props => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.03764 13.22C9.82742 11.3196 10.9573 9.95449 12.082 8.99L-4.37988e-07 8.99L-6.11085e-07 7.01L12.082 7.01C10.9573 6.04551 9.82742 4.68038 9.03763 2.77996L10.8024 2C12.1921 5.34399 14.871 6.6219 16 7.01L16 8.99C14.871 9.3781 12.1921 10.656 10.8024 14L9.03764 13.22Z" />
    </svg>
  );
};

// import SubtractIcon from '@/assets/icons2/subtract.svg';
const SubtractIcon: React.FC<React.ComponentProps<'svg'>> = props => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="16" viewBox="0 0 64 16" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 0C32 0 29.7393 -4.88757e-05 29.3333 0.999997C25.3389 10.8402 14.4264 16 0 16H64C49.5736 16 38.6611 10.8402 34.6667 0.999997C34.2607 -4.88757e-05 32 0 32 0Z"
      />
    </svg>
  );
};

import ChevronDownGradientIcon from '@/assets/icons2/chevron-down-gradient.svg';
import { ChevronDownIcon } from './ChevronDownIcon';

import ChevronUpGradientIcon from '@/assets/icons2/chevron-up-gradient.svg';
import { ChevronUpIcon } from './ChevronUpIcon';

import HideIcon from '@/assets/icons2/hide.svg';
import ShowIcon from '@/assets/icons2/show.svg';
import SwitchGradientIcon from '@/assets/icons2/switch-gradient.svg';

import SearchGradientIcon from '@/assets/icons2/search-gradient.svg';
import SearchIcon from '@/assets/icons2/search.svg';

import SwapGradientIcon from '@/assets/icons2/swap-gradient.svg';
import SwapIcon from '@/assets/icons2/swap.svg';

import LimitGradientIcon from '@/assets/icons2/limit-gradient.svg';
import LimitIcon from '@/assets/icons2/limit.svg';

import DCAGradientIcon from '@/assets/icons2/dca-gradient.svg';
import DCAIcon from '@/assets/icons2/dca.svg';

import HeartGradientIcon from '@/assets/icons2/heart-gradient.svg';
import HeartIcon from '@/assets/icons2/heart.svg';

import LogsGradientIcon from '@/assets/icons2/logs-gradient.svg';
import LogsIcon from '@/assets/icons2/logs.svg';

import SettingsGradientIcon from '@/assets/icons2/settings-gradient.svg';
import SettingsIcon from '@/assets/icons2/settings.svg';

import ShutdownGradientIcon from '@/assets/icons2/shutdown-gradient.svg';
import ShutdownIcon from '@/assets/icons2/shutdown.svg';

import WalletGradientIcon from '@/assets/icons2/wallet-gradient.svg';
import WalletIcon from '@/assets/icons2/wallet.svg';

import ExclamationIcon from '@/assets/icons2/exclamation.svg';

import TimeGradientIcon from '@/assets/icons2/time-gradient.svg';

export {
  AllChainIcon,
  AllChainWhiteIcon,
  AllChainGradientIcon,
  ArrowIcon,
  ArrowWhiteIcon,
  ArrowGradientIcon,
  ChevronDownIcon,
  ChevronDownGradientIcon,
  ChevronUpIcon,
  ChevronUpGradientIcon,
  SubtractIcon,
  ShowIcon,
  HideIcon,
  ShutdownIcon,
  ShutdownGradientIcon,
  SwitchGradientIcon,
  SearchIcon,
  SearchGradientIcon,
  SwapIcon,
  SwapGradientIcon,
  LimitIcon,
  LimitGradientIcon,
  DCAIcon,
  DCAGradientIcon,
  HeartIcon,
  HeartGradientIcon,
  LogsIcon,
  LogsGradientIcon,
  SettingsIcon,
  SettingsGradientIcon,
  ExclamationIcon,
  WalletIcon,
  WalletGradientIcon,
  TimeGradientIcon,
};
