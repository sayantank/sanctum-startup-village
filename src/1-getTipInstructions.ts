import "dotenv/config";

import {
	appendTransactionMessageInstructions,
	compileTransaction,
	createSolanaRpc,
	createTransactionMessage,
	getBase64EncodedWireTransaction,
	type Instruction,
	pipe,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	signTransaction,
} from "@solana/kit";
import {
	getSetComputeUnitLimitInstruction,
	getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getTransferSolInstruction } from "@solana-program/system";
import {
	GATEWAY_ENDPOINT,
	getAccounts,
	getTritonPrioritizationFees,
} from "./utils.js";

const { alice, bob } = await getAccounts();

const rpc = createSolanaRpc(process.env.RPC_URL as string);

const transferIx = getTransferSolInstruction({
	source: alice,
	destination: bob,
	amount: 1000n,
});

// Fetch latest blockhash, CU price and getTipInstructions response
const [{ value: latestBlockhash }, cuPrice, getTipInstructionsResponse] =
	await Promise.all([
		rpc.getLatestBlockhash().send(),
		getTritonPrioritizationFees([alice.address, bob]),
		fetch(GATEWAY_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: "startup-village",
				jsonrpc: "2.0",
				method: "getTipInstructions",
				params: [
					{
						feePayer: alice.address,
						// jitoTipRange: "low" | "medium" | "high" | "max", defaults to project parameters
						// deliveryMethodType: "rpc" | "jito" | "sanctum-sender" | "helius-sender", defaults to project parameters
					},
				],
			}),
		}),
	]);

if (!getTipInstructionsResponse.ok) {
	throw new Error("Failed to get tip instructions");
}

// Parse tip instructions response and convert to Instruction[]
const tipIxs: Instruction[] = [];
const tipIxsData = await getTipInstructionsResponse.json();
for (const ix of tipIxsData.result) {
	tipIxs.push({
		...ix,
		data: new Uint8Array(Object.values(ix.data)),
	});
}

// Hardcode CU limit, but you can also simulate the transaction to get the exact CU limit
const cuLimitIx = getSetComputeUnitLimitInstruction({
	units: 800,
});

const cuPriceIx = getSetComputeUnitPriceInstruction({
	microLamports: cuPrice,
});

const transaction = pipe(
	createTransactionMessage({ version: 0 }),
	(txm) =>
		appendTransactionMessageInstructions(
			[cuLimitIx, cuPriceIx, transferIx, ...tipIxs],
			txm,
		),
	(txm) => setTransactionMessageFeePayerSigner(alice, txm),
	(m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
	compileTransaction,
);

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
