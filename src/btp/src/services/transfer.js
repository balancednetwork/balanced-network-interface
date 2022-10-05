import * as ICONServices from '../connectors/ICONex/ICONServices';
import * as MoonbeamServices from '../connectors/MetaMask/services';
import { wallets } from '../utils/constants';

// import * as NEARServices from 'connectors/NEARWallet';

export const getCurrentTransferService = () => (curentWallet, currentNetwork) => {
  //console.log('ssss', window.accountInfo);
  const { wallet, currentNetwork: network } = window.accountInfo;
  //if (!wallet && !curentWallet) throw new Error('Missing wallet');
  //if (!network && !currentNetwork) throw new Error('Missing network');

  switch (wallet || curentWallet) {
    case wallets.metamask:
      return MoonbeamServices;

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
