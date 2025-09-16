import "dotenv/config";

import {
	appendTransactionMessageInstructions,
	compileTransaction,
	createTransactionMessage,
	getBase64EncodedWireTransaction,
	pipe,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	signTransaction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import {
	decodeTransaction,
	GATEWAY_ENDPOINT,
	getAccounts,
	NULL_LATEST_BLOCKHASH,
} from "./utils.js";

const { alice, bob } = await getAccounts();

// const rpc = createSolanaRpc(process.env.RPC_URL as string);

const transferIx = getTransferSolInstruction({
	source: alice,
	destination: bob,
	amount: 1000n,
});

const unsignedTransaction = pipe(
	createTransactionMessage({ version: 0 }),
	(txm) => appendTransactionMessageInstructions([transferIx], txm),
	(txm) => setTransactionMessageFeePayerSigner(alice, txm),
	// Since `buildGatewayTransaction` will set the blockhash for you,
	// We can avoid fetching the latest blockhash here
	(m) => setTransactionMessageLifetimeUsingBlockhash(NULL_LATEST_BLOCKHASH, m),
	compileTransaction,
);

const buildGatewayTransactionResponse = await fetch(GATEWAY_ENDPOINT, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		id: "startup-village",
		jsonrpc: "2.0",
		method: "buildGatewayTransaction",
		params: [
			getBase64EncodedWireTransaction(unsignedTransaction),
			{
				// encoding: "base64" | "base58", default is "base64"
				// skipSimulation: boolean, if true, you need to set the CU limit yourself since simulation allows to find out cu consumed.
				// skipPriorityFee: boolean, if true, you need to set the CU price yourself. Use Triton Priority Fee API
				// cuPriceRange: "low" | "medium" | "high", defaults to project parameters
				// jitoTipRange: "low" | "medium" | "high" | "max", defaults to project parameters
				// expireInSlots: number, defaults to project parameters
				// deliveryMethodType: "rpc" | "jito" | "sanctum-sender" | "helius-sender", defaults to project parameters
			},
		],
	}),
});

if (!buildGatewayTransactionResponse.ok) {
	throw new Error("Failed to build gateway transaction");
}

const {
	result: { transaction: encodedTransaction },
} = (await buildGatewayTransactionResponse.json()) as {
	result: {
		transaction: string;
		latestBlockhash: {
			blockhash: string;
			lastValidBlockHeight: string;
		};
	};
};

const transaction = decodeTransaction(encodedTransaction, "base64");

const signedTransaction = await signTransaction([alice.keyPair], transaction);

const sendTransactionResponse = await fetch(GATEWAY_ENDPOINT, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		id: "startup-village",
		jsonrpc: "2.0",
		method: "sendTransaction",
		params: [getBase64EncodedWireTransaction(signedTransaction)],
	}),
});

if (!sendTransactionResponse.ok) {
	throw new Error("Failed to send transaction");
}

const data = await sendTransactionResponse.json();

console.log(data);
