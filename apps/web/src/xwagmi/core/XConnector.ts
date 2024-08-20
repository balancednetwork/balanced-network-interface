import { XChainType } from '@/types';
import { XAccount } from './types';

export abstract class XConnector {
  xChainType: XChainType;
  name: string;
  _id: string;
  _icon: string;

  constructor(xChainType: XChainType, name: string) {
    this.xChainType = xChainType;
    this.name = name;
    this._id = name;
    this._icon = name;
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
