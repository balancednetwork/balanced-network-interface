import React, { Component } from 'react';

interface SocketState {
  messages: any[];
}

class ICONListener extends Component<{}, SocketState> {
  // socket: WebSocket;
  pingInterval: number | null = null;
  params = {
    height: '0xbaa0fd',
    eventFilters: [
      {
        event: 'CallMessage(str,str,int,int)',
        addr: 'cxc03ff5cbe2e0927774f5b0b9e73f331840cc0b8b',
      },
    ],
    logs: '0x1',
  };

  constructor(props: {}) {
    super(props);

    this.state = {
      messages: [],
    };

    // this.socket = new WebSocket('wss://berlin.net.solidwallet.io/api/v3/icon_dex/block');
    // this.socket = new WebSocket('wss://berlin.net.solidwallet.io/api/v3/icon_dex/block');

    // this.socket.onopen = () => {
    //   console.log('WebSocket connection opened');
    //   this.socket.send(JSON.stringify(this.params));
    //   // this.startPing();
    // };

    // this.socket.onmessage = event => {
    //   const message = JSON.parse(event.data);
    //   console.log('message from socket: ', message);
    //   this.setState(prevState => ({
    //     messages: [...prevState.messages, message],
    //   }));
    //   // if (this.state.messages.length > 10) {
    //   //   this.socket.close();
    //   // }
    // };

    // this.socket.onclose = () => {
    //   console.log('WebSocket connection closed');
    //   // this.stopPing();
    // };
  }

  // startPing() {
  //   this.pingInterval = setInterval(() => {
  //     console.log('should ping');
  //     if (this.socket.readyState === WebSocket.OPEN) {
  //       // console.log('ping');
  //       // this.socket.send();
  //     }
  //   }, 5000); // Send a ping message every 30 seconds
  // }

  // stopPing() {
  //   clearInterval(this.pingInterval!);
  // }

  // componentWillUnmount() {
  //   // this.stopPing();
  //   this.socket.close();
  // }

  render() {
    return (
      <div>
        {this.state.messages.map((message: any, index: number) => (
          <div key={index}>{JSON.stringify(message)}</div>
        ))}
      </div>
    );
  }
}

export default ICONListener;
