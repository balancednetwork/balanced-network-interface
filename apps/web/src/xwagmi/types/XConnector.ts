export class XConnector {
  account: string;
  constructor() {
    this.account = '';
  }
  setAccount(account: string): void {
    this.account = account;
  }
  getAccount(): string {
    return this.account;
  }
  async connect(): Promise<void> {
    this.setAccount('connected');
  }
  async disconnect(): Promise<void> {
    this.setAccount('');
  }
}
