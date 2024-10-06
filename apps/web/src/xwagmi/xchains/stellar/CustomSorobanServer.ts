import { Memo, MemoType, Operation, SorobanRpc, Transaction } from '@stellar/stellar-sdk';

class CustomSorobanServer extends SorobanRpc.Server {
  private customHeaders: Record<string, string>;

  constructor(serverUrl: string, customHeaders: Record<string, string>) {
    super(serverUrl, {
      allowHttp: true,
    });
    this.customHeaders = customHeaders;
  }

  async simulateTransaction(tx: Transaction<Memo<MemoType>, Operation[]>): Promise<any> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'simulateTransaction',
        params: {
          transaction: tx.toXDR(),
        },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

export default CustomSorobanServer;
