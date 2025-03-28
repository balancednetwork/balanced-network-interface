import { FeeBumpTransaction, Memo, MemoType, Operation, SorobanRpc, Transaction } from '@stellar/stellar-sdk';

class CustomSorobanServer extends SorobanRpc.Server {
  private customHeaders: Record<string, string>;

  constructor(serverUrl: string, customHeaders: Record<string, string>) {
    super(serverUrl, {
      allowHttp: true,
    });
    this.customHeaders = customHeaders;
  }

  async simulateTransaction(
    tx: Transaction<Memo<MemoType>, Operation[]>,
  ): Promise<SorobanRpc.Api.SimulateTransactionResponse> {
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
      throw new Error(`HTTP error simulating TX! status: ${response.status}`);
    }
    return response.json().then(json => json.result);
  }

  async sendTransaction(tx: Transaction | FeeBumpTransaction): Promise<SorobanRpc.Api.SendTransactionResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'sendTransaction',
        params: {
          transaction: tx.toXDR(),
        },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error submitting TX! status: ${response.status}`);
    }
    return response.json().then(json => json.result);
  }

  async getTransaction(hash: string): Promise<SorobanRpc.Api.GetTransactionResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'getTransaction',
        params: { hash },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error getting TX! status: ${response.status}`);
    }
    return response.json().then(json => json.result);
  }
}

export default CustomSorobanServer;
