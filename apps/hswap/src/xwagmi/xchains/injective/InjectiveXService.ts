import { XService } from '@/xwagmi/core/XService';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainGrpcWasmApi, IndexerGrpcAccountPortfolioApi, IndexerRestExplorerApi } from '@injectivelabs/sdk-ts';
import { IndexerGrpcExplorerApi } from '@injectivelabs/sdk-ts';
import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import { MsgBroadcaster, WalletStrategy } from '@injectivelabs/wallet-ts';
import { mainnet } from 'wagmi/chains';

export class InjectiveXService extends XService {
  private static instance: InjectiveXService;

  public walletStrategy: WalletStrategy;
  public indexerGrpcExplorerApi: IndexerGrpcExplorerApi;
  public indexerRestExplorerApi: IndexerRestExplorerApi;
  public indexerGrpcAccountPortfolioApi: IndexerGrpcAccountPortfolioApi;
  public chainGrpcWasmApi: ChainGrpcWasmApi;
  public msgBroadcastClient: MsgBroadcaster;

  private constructor() {
    super('INJECTIVE');

    const endpoints = getNetworkEndpoints(Network.Mainnet);
    this.walletStrategy = new WalletStrategy({
      chainId: ChainId.Mainnet,
      ethereumOptions: {
        ethereumChainId: EthereumChainId.Mainnet,
        rpcUrl: mainnet.rpcUrls.default.http[0],
      },
    });
    this.indexerGrpcExplorerApi = new IndexerGrpcExplorerApi(`${endpoints.explorer}`);
    this.indexerRestExplorerApi = new IndexerRestExplorerApi(`${endpoints.explorer}/api/explorer/v1`);
    this.indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
    this.msgBroadcastClient = new MsgBroadcaster({
      walletStrategy: this.walletStrategy,
      network: Network.Mainnet,
      endpoints,
    });
  }

  public static getInstance(): InjectiveXService {
    if (!InjectiveXService.instance) {
      InjectiveXService.instance = new InjectiveXService();
    }
    return InjectiveXService.instance;
  }
}
