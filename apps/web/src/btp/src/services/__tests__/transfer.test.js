import { wallets, connectedNetWorks } from 'utils/constants';

import { getCurrentTransferService } from '../transfer';

jest.mock('store', () => {
  return {
    getState: jest.fn().mockImplementation(() => ({ account: { wallet: '', currentNetwork: '' } })),
    dispatch: { modal: {} },
  };
});

describe('services/transfer', () => {
  test('Metamask wallet + ICON-BSC pair', () => {
    const service = getCurrentTransferService()(wallets.metamask, connectedNetWorks.bsc);
    expect(service.serviceName).toBe(connectedNetWorks.bsc);
  });

  test('Metamask wallet + ICON-Moonbeam pair', () => {
    const service = getCurrentTransferService()(wallets.metamask, connectedNetWorks.moonbeam);
    expect(service.serviceName).toBe(connectedNetWorks.moonbeam);
  });

  test('ICONex wallet', () => {
    const service = getCurrentTransferService()(wallets.iconex, connectedNetWorks.icon);
    expect(service.serviceName).toBe(connectedNetWorks.icon);
  });

  test('Has enough functions on ICON service', () => {
    const service = getCurrentTransferService()(wallets.iconex, connectedNetWorks.icon);
    expect(service.transfer).toBeTruthy();
    expect(service.getBalance).toBeTruthy();
    expect(service.getBalanceOf).toBeTruthy();
    expect(service.reclaim).toBeTruthy();
    expect(service.setApproveForSendNonNativeCoin).toBeTruthy();
    expect(service.sendNonNativeCoin).toBeTruthy();
  });

  test('Has enough functions on Moonbeam service', () => {
    const service = getCurrentTransferService()(wallets.metamask, connectedNetWorks.moonbeam);
    expect(service.transfer).toBeTruthy();
    expect(service.getBalanceOf).toBeTruthy();
    expect(service.reclaim).toBeTruthy();
  });
});
