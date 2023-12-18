import { ChainInfo } from '@keplr-wallet/types';

import { ArchwayTxResponseType } from './types';

export const CONSTANTINE_CHAIN_INFO: ChainInfo = {
  // Chain-id of the Cosmos SDK chain.
  chainId: 'constantine-3',
  // The name of the chain to be displayed to the user.
  chainName: 'Constantine Testnet',
  // RPC endpoint of the chain.
  rpc: 'https://rpc.constantine.archway.tech',
  // REST endpoint of the chain.
  rest: 'https://api.constantine.archway.tech',
  // Staking coin information
  stakeCurrency: {
    // Coin denomination to be displayed to the user.
    coinDenom: 'CONST',
    // Actual denom (i.e. uatom, uscrt) used by the blockchain.
    coinMinimalDenom: 'aconst',
    // # of decimal points to convert minimal denomination to user-facing denomination.
    coinDecimals: 18,
    // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
    // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
    // coinGeckoId: ""
  },
  // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
  // The 'stake' button in Keplr extension will link to the webpage.
  // walletUrlForStaking: "",
  // The BIP44 path.
  bip44: {
    // You can only set the coin type of BIP44.
    // 'Purpose' is fixed to 44.
    coinType: 118,
  },
  // Bech32 configuration to show the address to user.
  // This field is the interface of
  // {
  //   bech32PrefixAccAddr: string;
  //   bech32PrefixAccPub: string;
  //   bech32PrefixValAddr: string;
  //   bech32PrefixValPub: string;
  //   bech32PrefixConsAddr: string;
  //   bech32PrefixConsPub: string;
  // }
  bech32Config: {
    bech32PrefixAccAddr: 'archway',
    bech32PrefixAccPub: 'archwaypub',
    bech32PrefixValAddr: 'archwayvaloper',
    bech32PrefixValPub: 'archwayvaloperpub',
    bech32PrefixConsAddr: 'archwayvalcons',
    bech32PrefixConsPub: 'archwayvalconspub',
  },
  // List of all coin/tokens used in this chain.
  currencies: [
    {
      // Coin denomination to be displayed to the user.
      coinDenom: 'CONST',
      // Actual denom (i.e. uatom, uscrt) used by the blockchain.
      coinMinimalDenom: 'aconst',
      // # of decimal points to convert minimal denomination to user-facing denomination.
      coinDecimals: 18,
      // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
      // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
      // coinGeckoId: ""
    },
  ],
  // List of coin/tokens used as a fee token in this chain.
  feeCurrencies: [
    {
      // Coin denomination to be displayed to the user.
      coinDenom: 'CONST',
      // Actual denom (i.e. uatom, uscrt) used by the blockchain.
      coinMinimalDenom: 'aconst',
      // # of decimal points to convert minimal denomination to user-facing denomination.
      coinDecimals: 18,
      // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
      // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
      // coinGeckoId: ""
    },
  ],
  features: ['cosmwasm'],
};

export const BORROW_TX: ArchwayTxResponseType = {
  logs: [
    {
      msg_index: 0,
      log: '',
      events: [
        {
          type: 'execute',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
            },
            {
              key: '_contract_address',
              value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
            },
            {
              key: '_contract_address',
              value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
            },
          ],
        },
        {
          type: 'message',
          attributes: [
            {
              key: 'action',
              value: '/cosmwasm.wasm.v1.MsgExecuteContract',
            },
            {
              key: 'module',
              value: 'wasm',
            },
            {
              key: 'sender',
              value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
            },
          ],
        },
        {
          type: 'reply',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
            },
            {
              key: '_contract_address',
              value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
            },
          ],
        },
        {
          type: 'wasm',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
            },
            {
              key: 'action',
              value: 'xcall-service',
            },
            {
              key: 'method',
              value: 'send_packet',
            },
            {
              key: 'sequence_no',
              value: '19',
            },
            {
              key: '_contract_address',
              value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
            },
            {
              key: 'method',
              value: 'send_message',
            },
            {
              key: '_contract_address',
              value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
            },
            {
              key: 'action',
              value: 'send_packet',
            },
            {
              key: '_contract_address',
              value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
            },
            {
              key: 'action',
              value: 'call_message',
            },
            {
              key: 'method',
              value: 'reply_forward_host',
            },
            {
              key: '_contract_address',
              value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
            },
            {
              key: 'action',
              value: 'reply',
            },
            {
              key: 'method',
              value: 'sendcall_message',
            },
          ],
        },
        {
          type: 'wasm-CallMessageSent',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
            },
            {
              key: 'from',
              value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
            },
            {
              key: 'to',
              value: '0x7.icon/cx501cce20fc5d5a0e322d5a600a9903f3f4832d43',
            },
            {
              key: 'sn',
              value: '19',
            },
          ],
        },
        {
          type: 'wasm-send_packet',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
            },
            {
              key: 'packet_channel_ordering',
              value: 'ORDER_UNORDERED',
            },
            {
              key: 'packet_connection',
              value: 'connection-0',
            },
            {
              key: 'packet_data_hex',
              value:
                'f8aa0000b8a6f8a401b8a1f89fb6617263687761792f61726368776179316d67357563647332306775687675387479756532667733356c367366746174776a6434687577aa6378353031636365323066633564356130653332326435613630306139393033663366343833326434331300b8383078646138373738343236663732373236663737386335343737363937343734363537323431373337333635373438343331333033303330c0',
            },
            {
              key: 'packet_dst_channel',
              value: 'channel-10',
            },
            {
              key: 'packet_dst_port',
              value: 'xcall',
            },
            {
              key: 'packet_sequence',
              value: '19',
            },
            {
              key: 'packet_src_channel',
              value: 'channel-0',
            },
            {
              key: 'packet_src_port',
              value: 'xcall',
            },
            {
              key: 'packet_timeout_height',
              value: '0-11749058',
            },
            {
              key: 'packet_timeout_timestamp',
              value: '0',
            },
          ],
        },
      ],
    },
  ],
  height: 1280017,
  transactionHash: '5A6E2DDB2E3E5587223FD3296BF2D3AA5CCE89F2932E413D49CD5AB1D5E43008',
  events: [
    {
      type: 'coin_spent',
      attributes: [
        {
          key: 'spender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'coin_received',
      attributes: [
        {
          key: 'receiver',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'transfer',
      attributes: [
        {
          key: 'recipient',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'sender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'sender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
      ],
    },
    {
      type: 'coin_spent',
      attributes: [
        {
          key: 'spender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'coin_received',
      attributes: [
        {
          key: 'receiver',
          value: 'archway1245yut9zht8q4hz39sd0lzqtzkuw5us50e94ya',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'transfer',
      attributes: [
        {
          key: 'recipient',
          value: 'archway1245yut9zht8q4hz39sd0lzqtzkuw5us50e94ya',
        },
        {
          key: 'sender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
        {
          key: 'amount',
          value: '525000000000000000aconst',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'sender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'fee',
          value: '1050000000000000000aconst',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'acc_seq',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw/20',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'signature',
          value: 'bwKoL3671BeHCSm80wJ1cNiXKdBEh0R3YM0LxXAedikpNvL5c7fw6RWYXCxs37pskBqfirAax7XIEkMngSSzFw==',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/cosmwasm.wasm.v1.MsgExecuteContract',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'module',
          value: 'wasm',
        },
        {
          key: 'sender',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
      ],
    },
    {
      type: 'execute',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
        },
        {
          key: 'action',
          value: 'xcall-service',
        },
        {
          key: 'method',
          value: 'send_packet',
        },
        {
          key: 'sequence_no',
          value: '19',
        },
      ],
    },
    {
      type: 'wasm-CallMessageSent',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
        },
        {
          key: 'from',
          value: 'archway1mg5ucds20guhvu8tyue2fw35l6sftatwjd4huw',
        },
        {
          key: 'to',
          value: '0x7.icon/cx501cce20fc5d5a0e322d5a600a9903f3f4832d43',
        },
        {
          key: 'sn',
          value: '19',
        },
      ],
    },
    {
      type: 'execute',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
        },
        {
          key: 'method',
          value: 'send_message',
        },
      ],
    },
    {
      type: 'execute',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
        },
        {
          key: 'action',
          value: 'send_packet',
        },
      ],
    },
    {
      type: 'wasm-send_packet',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1ahplgd4nzzvqcpjjgaekauecac6yvfx52kzn2u7xeawhtutawuusrf628n',
        },
        {
          key: 'packet_channel_ordering',
          value: 'ORDER_UNORDERED',
        },
        {
          key: 'packet_connection',
          value: 'connection-0',
        },
        {
          key: 'packet_data_hex',
          value:
            'f8aa0000b8a6f8a401b8a1f89fb6617263687761792f61726368776179316d67357563647332306775687675387479756532667733356c367366746174776a6434687577aa6378353031636365323066633564356130653332326435613630306139393033663366343833326434331300b8383078646138373738343236663732373236663737386335343737363937343734363537323431373337333635373438343331333033303330c0',
        },
        {
          key: 'packet_dst_channel',
          value: 'channel-10',
        },
        {
          key: 'packet_dst_port',
          value: 'xcall',
        },
        {
          key: 'packet_sequence',
          value: '19',
        },
        {
          key: 'packet_src_channel',
          value: 'channel-0',
        },
        {
          key: 'packet_src_port',
          value: 'xcall',
        },
        {
          key: 'packet_timeout_height',
          value: '0-11749058',
        },
        {
          key: 'packet_timeout_timestamp',
          value: '0',
        },
      ],
    },
    {
      type: 'reply',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway14zylrd8xdhkfg6u33lnwrkk6jqemy9u6eqef4pxkgag89jlktr0serdckd',
        },
        {
          key: 'action',
          value: 'call_message',
        },
        {
          key: 'method',
          value: 'reply_forward_host',
        },
      ],
    },
    {
      type: 'reply',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1fhhc88hmmgkeh622yegmp305qrx50hgeca35uxqtk69thke79esqa6fh8a',
        },
        {
          key: 'action',
          value: 'reply',
        },
        {
          key: 'method',
          value: 'sendcall_message',
        },
      ],
    },
  ],
  gasWanted: 700000,
  gasUsed: 693850,
};
