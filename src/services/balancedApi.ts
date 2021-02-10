import { environments } from '../environments';

class BalancedAPIService {
  protected apiEndpoint: string = `http://${environments.local.api}/api/v1`;

  async convertICX2USD(): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(`${this.apiEndpoint}/prices/?base=ICX&quote=USD`, {
        method: 'GET',
        headers: {
          accecpt: 'application/json',
          'content-type': 'application/json',
        },
      })
        .then(data => data.json())
        .then(resolve)
        .catch(reject);
    });
  }
}

export const iBalancedAPIService: BalancedAPIService = new BalancedAPIService();
