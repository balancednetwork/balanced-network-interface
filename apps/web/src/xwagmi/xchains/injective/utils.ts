export const switchEthereumChain = async chainId => {
  const metamaskProvider = (window as any).ethereum as any;

  await Promise.race([
    metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId}` }],
    }),
    new Promise<void>(resolve =>
      metamaskProvider.on('change', ({ chain }: any) => {
        if (chain?.id === chainId) {
          resolve();
        }
      }),
    ),
  ]);
};
