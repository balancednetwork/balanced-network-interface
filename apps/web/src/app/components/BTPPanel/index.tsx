import React from 'react';

import Transfer from 'btp/src/containers/Transfer';
import store from 'btp/src/store';
import { Provider } from 'react-redux';
import { Flex } from 'rebass/styled-components';

import { DefaultLayout } from '../Layout';
import WalletConnect from './Wallets/WalletConnect';

const BTPPanel = () => {
  // wrap context here

  return (
    <DefaultLayout>
      <Provider store={store}>
        <Flex flexDirection={'column'} alignItems={'center'} width={'100%'}>
          <WalletConnect />
          <Transfer />
        </Flex>
      </Provider>
    </DefaultLayout>
  );
};

export default BTPPanel;
