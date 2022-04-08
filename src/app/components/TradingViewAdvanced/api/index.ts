import { DatafeedBase } from './datafeed-base';
import { Requester } from './requester';

class Datafeed extends DatafeedBase {
  public constructor(datafeedURL: string, updateFrequency: number = 10 * 1000) {
    const requester = new Requester();
    super(datafeedURL, requester, updateFrequency);
  }
}

export default Datafeed;
