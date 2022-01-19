# ENS scriptz

## Getting started

1. Make sure you install all da deps!

```
yarn
```

2. Copy the contents from `.env.example` to your own `.env` file.

> Note: This is experimental. Pls don't run any of this interaction on the mainnet! A testnet is highly recommended.

## Register an ENS

### Usage

```
yarn register-ens [ens name] [owner address] [duration in years]
```

### Example

```
yarn register-ens example.eth 0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b 1
```