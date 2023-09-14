import React from 'react';

import { v4 as uuidv4 } from 'uuid';

// import { ARCHWAY_CONTRACTS } from '../config';

// Define the address that is checked in the transactions.
// const address = ARCHWAY_CONTRACTS.xcall;
// Initialize websocket and wsQuery variables.
let WS_QUERY = {
  jsonrpc: '2.0',
  method: 'subscribe',
  id: uuidv4().toString(),
  params: {
    // query: `tm.event = 'Tx' AND transfer.recipient CONTAINS '${address}'`,
    query: `tm.event = 'Tx' AND wasm-CallMessage EXISTS`,
  },
};
// This function initiates a WebSocket connection and sends a subscription request to track transactions that fulfill certain conditions.
export const useArchwayEventListener = (shouldListen: boolean) => {
  const [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);

  const disconnectFromWebsocket = React.useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // Send an 'unsubscribe' message to the server.
    socket.send(JSON.stringify({ ...WS_QUERY, method: 'unsubscribe' }));
    // Close the WebSocket connection.
    socket.close();
  }, [socket]);

  React.useEffect(() => {
    if (shouldListen && !socket) {
      // Open a new WebSocket connection to the specified URL.
      //mainnet wss:///rpc.mainnet.archway.io:443/websocket - see https://docs.archway.io/resources/networks
      const websocket = new WebSocket('wss://rpc.constantine.archway.tech:443/websocket');

      websocket.onopen = () => {
        console.log('archway ws opened');
        websocket.send(JSON.stringify(WS_QUERY));
      };
      // When a message (i.e., a matching transaction) is received, log the transaction and close the WebSocket connection.
      websocket.onmessage = event => {
        const eventData = JSON.parse(event.data);
        console.log('Arch event: ', eventData.result && eventData.result.events);
        // if (eventData && eventData.result && eventData.result.data) {x
        //   console.log('Matching transaction found' + JSON.stringify(eventData.result.data));
        //   disconnectFromWebsocket();
        // }
      };
      // If an error occurs with the WebSocket, log the error and close the WebSocket connection.
      websocket.onerror = error => {
        console.error(error);
        disconnectFromWebsocket();
      };
      websocket.onclose = () => {
        console.log('archway ws closed');
      };
      setSocket(websocket);
    } else {
      if (socket) {
        disconnectFromWebsocket();
      }
    }
  }, [shouldListen, socket, disconnectFromWebsocket]);
};
