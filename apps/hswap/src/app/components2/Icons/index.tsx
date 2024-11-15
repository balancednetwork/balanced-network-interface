import React from 'react';

import AllChainGradientIcon from '@/assets/icons2/all-chain-gradient.svg';
import AllChainWhiteIcon from '@/assets/icons2/all-chain-white.svg';
import AllChainIcon from '@/assets/icons2/all-chain.svg';

import ArrowGradientIcon from '@/assets/icons2/arrow-gradient.svg';
import ArrowWhiteIcon from '@/assets/icons2/arrow-white.svg';
import ArrowIcon from '@/assets/icons2/arrow.svg';

// import SubtractIcon from '@/assets/icons2/subtract.svg';
const SubtractIcon: React.FC<React.ComponentProps<'svg'>> = props => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="16" viewBox="0 0 64 16" {...props}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M32 0C32 0 29.7393 -4.88757e-05 29.3333 0.999997C25.3389 10.8402 14.4264 16 0 16H64C49.5736 16 38.6611 10.8402 34.6667 0.999997C34.2607 -4.88757e-05 32 0 32 0Z"
      />
    </svg>
  );
};

import ChevronDownGradientIcon from '@/assets/icons2/chevron-down-gradient.svg';
import ChevronDownWhiteIcon from '@/assets/icons2/chevron-down-white.svg';
import ChevronDownIcon from '@/assets/icons2/chevron-down.svg';
import ChevronUpGradientIcon from '@/assets/icons2/chevron-up-gradient.svg';

import HideIcon from '@/assets/icons2/hide.svg';
import ShowIcon from '@/assets/icons2/show.svg';
import ShutdownIcon from '@/assets/icons2/shutdown.svg';
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

export {
  AllChainIcon,
  AllChainWhiteIcon,
  AllChainGradientIcon,
  ArrowIcon,
  ArrowWhiteIcon,
  ArrowGradientIcon,
  ChevronDownIcon,
  ChevronDownWhiteIcon,
  ChevronDownGradientIcon,
  ChevronUpGradientIcon,
  SubtractIcon,
  ShowIcon,
  HideIcon,
  ShutdownIcon,
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
};
