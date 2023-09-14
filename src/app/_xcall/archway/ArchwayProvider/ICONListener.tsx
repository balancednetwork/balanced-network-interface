import React, { Component } from 'react';

import { DestinationXCallData, SupportedXCallChains } from 'app/_xcall/types';
import bnJs from 'bnJs';

interface SocketState {
  messages: any[];
}

class ICONListener extends Component<
  { blockHeight: string; addDestinationEvent: (chain: SupportedXCallChains, data: DestinationXCallData) => void },
  SocketState
> {
  socket: WebSocket;
  pingInterval: number | null = null;
  params = {
    height: this.props.blockHeight,
    // height: '0xC85C64',
    eventFilters: [
      {
        event: 'CallMessage(str,str,int,int,bytes)',
        addr: bnJs.XCall.address,
      },
    ],
    logs: '0x1',
  };

  constructor(props: { blockHeight; addDestinationEvent }) {
    super(props);

    this.state = {
      messages: [],
    };

    this.socket = new WebSocket('wss://berlin.net.solidwallet.io/api/v3/icon_dex/block');

    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      this.socket.send(JSON.stringify(this.params));
    };

    this.socket.onmessage = event => {
      const message = JSON.parse(event.data);
      console.log('ICON block: ', message);
      this.setState(prevState => ({
        messages: [...prevState.messages, message],
      }));
      // if (this.state.messages.length > 5) {
      //   this.socket.close();
      // }
      if (message.logs) {
        const callMessageLog =
          message.logs && message.logs[0][0].find(log => log.indexed[0] === 'CallMessage(str,str,int,int,bytes)');
        console.log(message.logs);
        if (callMessageLog) {
          const snRaw = callMessageLog.indexed[3];
          const sn = snRaw && parseInt(snRaw, 16);
          const reqId = callMessageLog.data[0];
          const data = callMessageLog.data[1];
          if (sn && reqId) {
            this.props.addDestinationEvent('icon', { sn, reqId, data });
          }
        }
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    return (
      <div>
        {/* {[...this.state.messages].reverse().map((message: any, index: number) => (
          <div key={index}>{JSON.stringify(message)}</div>
        ))} */}
      </div>
    );
  }
}

export default ICONListener;
