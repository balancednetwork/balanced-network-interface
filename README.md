# Balanced Network Interface

An open source interface for Balanced: a decentralized synthetic asset generator and trading platform on the ICON Network.

- Website: [balanced.network](https://balanced.network/)
- Demo: [balanced.network/demo](https://balanced.network/demo/)
- Interface: [app.balanced.network](https://app.balanced.network/)
- Twitter: [@BalancedDAO](https://twitter.com/BalancedDAO)
- Telegram: [https://t.me/balanced_official](https://t.co/hgsB0U150t?amp=1)
- Medium: [@BalancedDAO](https://balanceddao.medium.com/)
- Whitepaper: [Link](https://docs.balanced.network/technical/white-paper)

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Lint

```bash
yarn lint
```

Please run the lint task before commit.

### Configuring the environment (optional)

Create an .env file

```
## For Sejong Testnet
REACT_APP_NETWORK_ID=83

## For Yeouido Testnet
REACT_APP_NETWORK_ID=3

## For Mainnet
REACT_APP_NETWORK_ID=1

```

## Contribution

**Please open all pull requests against the `master` branch.**
CI checks will run against all PRs.

### Code Style/Convention

The Balanced frontend repo uses the Airbnb Code style.
https://github.com/airbnb/javascript#naming-conventions
