# Gateway Demo - Sanctum Startup Village

An example implementation of how to use the [Gateway](https://gateway.sanctum.so) to build and send transactions on Solana. 

## Prerequisites

- Node.js (LTS version recommended)
- pnpm (or any packagage manager of your choice)
- Typescript

## Environment Variables

Create a `.env` file in the root directory using the `.env.example` file as a template.

## Running the Demo

### Using `getTipInstructions`

The `getTipInstructions` method returns the tip instructions that need to be added to your transaction to ensure it is sent to a specific set of delivery methods.

The chosen delivery methods can be decided by either the **Transaction Routing** parameter on your Dashboard, or by using the `deliveryMethodType` field in the `getTipInstructions` method params.

```bash
pnpm run:1
```

### Using `buildGatewayTransaction`

The `buildGatewayTransaction` method accepts a minimal transaction, and then returns an updated transaction that is ready to be sent to via Gateway.

One can use the `buildGatewayTransaction` method to do the following:

- Simulate the transaction for preflight checks, and get an estimate of the CUs consumed to set the CU limit accordingly.
- Fetch the latest prioritization fees for the transaction, and set the CU price accordingly.
- Add the tip instructions to route the trasaction to the desired delivery methods.
- Set the appropriate `latestBlockhash` for the transaction, depending on whether you want the transaction to expire sooner than usual.

```bash
pnpm run:2
```