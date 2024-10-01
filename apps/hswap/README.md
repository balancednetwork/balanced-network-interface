# Balanced

An open-source interface for Balanced: a decentralised exchange and stablecoin platform on the ICON Network.

- Website: [balanced.network](https://balanced.network/)
- App: [app.balanced.network](https://app.balanced.network/)
- Demo: [balanced.network/demo](https://balanced.network/demo/)
- Documentation: [docs.balanced.network](https://docs.balanced.network/)
- Blog: [blog.balanced.network](https://blog.balanced.network/)
- White paper: [Link](https://docs.balanced.network/technical/white-paper)

- Twitter: [@BalancedDAO](https://twitter.com/BalancedDAO)
- Discord: [Link](https://discord.com/invite/7nBMr963SU)

---

## List a token

If you want the Balanced app to support a new token, you can submit a pull request to add it to the community token list.

### 1. Add the token logo to the icon repository

Upload the token logo to make sure it's easy to recognise in the app. Tokens that don't have a logo will use the default token icon.

1. Go to https://github.com/balancednetwork/icons and create a new branch.
2. Upload a PNG with the dimensions 512 x 512. The file name should be the token symbol in lowercase, i.e. `baln.png`.
3. Submit a pull request to merge your changes into the `main` branch.

### 2. Add a token to the community token list

1. Go to https://github.com/balancednetwork/balanced-network-interface/blob/master/src/store/lists/communitylist.json and create a new branch.
2. Add the details for your token to the bottom of the list. You'll need to provide the:
   - contract address
   - chain ID (1 for mainnet, 7 for testnet)
   - token name
   - token symbol
   - decimals (18 is standard)
   - URI for the logo you've uploaded (https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/ticker.png)
3. Open a pull request to merge your changes into the `master` branch. Make sure to reference the token logo PR.

---

## Development

### Install dependencies

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

Run the lint task before you commit.

### Configuring the environment (optional)

Create an .env file

```
## For Sejong testnet
REACT_APP_NETWORK_ID=83

## For Yeouido testnet
REACT_APP_NETWORK_ID=3

## For Mainnet
REACT_APP_NETWORK_ID=1

```

## Contribution

**Open all pull requests against the `master` branch.**
CI checks will run against all PRs.

### Code style/convention

The Balanced frontend repo uses the Airbnb code style.
https://github.com/airbnb/javascript#naming-conventions

### Pull request review guidelines

Cosmetic fixes & small bugs

- Set PR to mainnet
- Review: UX team

Large bug fixes (i.e. issue with transaction router)

- Set PR to mainnet
- Review: UX team & separate FE dev

New features (smart contracts on testnet)

- Set PR to testnet
- Review: UX team & separate FE dev

New features (smart contracts on mainnet)

- Set PR to mainnet
- Review: UX team & separate FE dev
