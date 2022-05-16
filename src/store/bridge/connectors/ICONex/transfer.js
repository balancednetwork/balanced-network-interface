import { connectedNetWorks } from '../../utils/constants';
import { MOON_BEAM_NODE, BSC_NODE, signingActions } from '../constants';
import { sendNativeCoin, depositTokensIntoBSH, setApproveForSendNonNativeCoin } from './ICONServices';

export const transfer = (tx, isSendingNativeCoin, network) => {
  window[signingActions.globalName] = signingActions.transfer;
  const networkAddress = BSC_NODE[network] ? BSC_NODE.networkAddress : MOON_BEAM_NODE.networkAddress;

  if (isSendingNativeCoin) {
    sendNativeCoin(tx, networkAddress);
  } else {
    switch (network) {
      case connectedNetWorks.moonbeam:
        setApproveForSendNonNativeCoin(tx);
        break;
      case connectedNetWorks.bsc:
        depositTokensIntoBSH(tx);
        break;
      case connectedNetWorks.near:
        console.log('Not implemented yet');
        break;
      default:
        console.log('No matching paired network');
        break;
    }
  }
};
