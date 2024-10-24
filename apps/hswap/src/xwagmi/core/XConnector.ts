import { XAccount, XChainType } from '../types';

export abstract class XConnector {
  xChainType: XChainType;
  name: string;
  _id: string;
  _icon: string | undefined;

  constructor(xChainType: XChainType, name: string, id: string) {
    this.xChainType = xChainType;
    this.name = name;
    this._id = id;
  }

  abstract connect(): Promise<XAccount | undefined>;
  abstract disconnect(): Promise<void>;

  public get id() {
    return this._id;
  }
  public get icon(): string | undefined {
    return this._icon;
  }
}
