import * as ICONServices from '../connectors/ICONex/ICONServices';
import * as BSCServices from '../connectors/MetaMask/services/BSCServices';
import * as MoonbeamServices from '../connectors/MetaMask/services/MoonbeamServices';
import { wallets, connectedNetWorks } from '../utils/constants';

export const getCurrentTransferService = () => (curentWallet, currentNetwork) => {
  console.log(curentWallet);
  console.log(currentNetwork);
  // const { wallet, currentNetwork: network } = store.getState().account;
  const account = JSON.parse(String(localStorage.getItem('account_info')));
  const { wallet, currentNetwork: network } = account;
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

    // case wallets.near:
    //   return NEARServices;

    default:
      console.log('No matching wallet service');
      break;
  }
};

const getService = getCurrentTransferService();

export { getService };
