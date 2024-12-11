export const intentAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_nid',
        type: 'string',
      },
      {
        internalType: 'uint16',
        name: '_protocolFee',
        type: 'uint16',
      },
      {
        internalType: 'address',
        name: '_feeHandler',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_relayer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_premit2',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'targetNetwork',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'sn',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_msg',
        type: 'bytes',
      },
    ],
    name: 'Message',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'srcNID',
        type: 'string',
      },
    ],
    name: 'OrderCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'OrderClosed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'srcNID',
        type: 'string',
      },
    ],
    name: 'OrderFilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'emitter',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'srcNID',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'dstNID',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'creator',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'destinationAddress',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'token',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'toToken',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'toAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'SwapIntent',
    type: 'event',
  },
  {
    inputs: [],
    name: 'NATIVE_ADDRESS',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'connSn',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depositId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeHandler',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'emitter',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'srcNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'dstNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'creator',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'destinationAddress',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'token',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'toToken',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'toAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct Types.SwapOrder',
        name: 'order',
        type: 'tuple',
      },
      {
        internalType: 'string',
        name: 'solverAddress',
        type: 'string',
      },
    ],
    name: 'fill',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'finishedOrders',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'getOrder',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'emitter',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'srcNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'dstNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'creator',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'destinationAddress',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'token',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'toToken',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'toAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct Types.SwapOrder',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'srcNetwork',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '_connSn',
        type: 'uint256',
      },
    ],
    name: 'getReceipt',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nid',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'orders',
    outputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'emitter',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'srcNID',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'dstNID',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'creator',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'destinationAddress',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'token',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'toToken',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'toAmount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'permit2',
    outputs: [
      {
        internalType: 'contract IPermit2',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFee',
    outputs: [
      {
        internalType: 'uint16',
        name: '',
        type: 'uint16',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'receipts',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'srcNetwork',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '_connSn',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_msg',
        type: 'bytes',
      },
    ],
    name: 'recvMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'relayAdress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_address',
        type: 'address',
      },
    ],
    name: 'setAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'emitter',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'srcNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'dstNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'creator',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'destinationAddress',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'token',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'toToken',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'toAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct Types.SwapOrder',
        name: 'order',
        type: 'tuple',
      },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'emitter',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'srcNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'dstNID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'creator',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'destinationAddress',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'token',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'toToken',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'toAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct Types.SwapOrder',
        name: 'order',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'token',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            internalType: 'struct IPermit2.TokenPermissions',
            name: 'permitted',
            type: 'tuple',
          },
          {
            internalType: 'uint256',
            name: 'nonce',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct IPermit2.PermitTransferFrom',
        name: '_permit',
        type: 'tuple',
      },
    ],
    name: 'swapPermit2',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
