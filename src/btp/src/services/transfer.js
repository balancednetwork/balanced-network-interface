import * as ICONServices from 'btp/src/connectors/ICONex/ICONServices';
import * as BSCServices from 'btp/src/connectors/MetaMask/services/BSCServices';
import * as MoonbeamServices from 'btp/src/connectors/MetaMask/services/MoonbeamServices';
import * as NEARServices from 'btp/src/connectors/NEARWallet';
import store from 'btp/src/store';
import { wallets, connectedNetWorks } from 'btp/src/utils/constants';

export const getCurrentTransferService = () => (curentWallet, currentNetwork) => {
  const { wallet, currentNetwork: network } = store.getState().account;
  if (!wallet && !curentWallet) throw new Error('Missing wallet');
  if (!network && !currentNetwork) throw new Error('Missing network');

  switch (wallet || curentWallet) {
    case wallets.metamask:
      // There are 2 networks using Metamask now: Moonbeam & BSC
      switch (network || currentNetwork) {
        case connectedNetWorks.moonbeam:
          return MoonbeamServices;

        case connectedNetWorks.bsc:
          return BSCServices;
        default:
          console.log('No matching network');
          break;
      }
      break;

    case wallets.iconex:
    case wallets.hana:
      return ICONServices;

    case wallets.near:
      return NEARServices;

    default:
      console.log('No matching wallet service');
      break;
  }
};

const getService = getCurrentTransferService();

export { getService };
