import * as ICONServices from '../connectors/ICONex/ICONServices';
import * as Web3Services from '../connectors/MetaMask/services';
import { wallets } from '../utils/constants';
// import * as NEARServices from '../connectors/NearWallet';

export const getCurrentTransferService = () => (accountInfo, curentWallet, currentNetwork) => {
  const { wallet, currentNetwork: network } = accountInfo;
  if (!wallet && !curentWallet) throw new Error('Missing wallet');
  if (!network && !currentNetwork) throw new Error('Missing network');

  switch (wallet || curentWallet) {
    case wallets.metamask:
      return Web3Services;

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
