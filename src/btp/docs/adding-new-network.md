# Integrate a New Network

## Front-end Tasks

There are 3 preparation steps for the new network added:

1. Determine what trust wallet is being used for the new network. And, how to connect and transfer tokens through the wallet by its API set.

2. A transfer guideline includes working tested scripts to determine steps for each specific transfer case. An example here: https://github.com/icon-project/btp/blob/btp_web3labs/doc/token-transfer-guide.md#run-using-script.

3. For the UI, the new network and its native token need to be added to some selectors to reflect the corresponding transfer case.

[Details](/docs/adding-new-chain-configuration.md)

## Back-end Tasks

To support a new network basically it requires to implement a new blockchain data indexer which will read data from blockchain, save into local database, and process all related events/actions.

1. Add configuration for network and its native coin data (configuration files, database)

2. Implement a new data indexer

3. Implement data processing modules: transactions, relays, tokens, mint/burn
