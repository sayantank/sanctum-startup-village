import {
	address,
	blockhash,
	createKeyPairSignerFromBytes,
	getBase58Encoder,
	getBase64Encoder,
	getTransactionDecoder,
} from "@solana/kit";

export const NULL_LATEST_BLOCKHASH = {
	blockhash: blockhash("11111111111111111111111111111111"),
	lastValidBlockHeight: 1000n,
};
export const GATEWAY_ENDPOINT = `https://tpg.sanctum.so/v1/mainnet?apiKey=${process.env.GATEWAY_API_KEY}`;

export async function getAccounts() {
	const alicePrivateKey = process.env.ALICE_PRIVATE_KEY;
	const bobPublicKey = process.env.BOB_PUBLIC_KEY;

	if (!alicePrivateKey || !bobPublicKey) {
		throw new Error("Private keys not found");
	}

	const alice = await createKeyPairSignerFromBytes(
		getBase58Encoder().encode(alicePrivateKey),
	);
	const bob = address(bobPublicKey);

	return { alice, bob };
}

export function decodeTransaction(
	encodedTransaction: string,
	encoding: "base64" | "base58" = "base64",
) {
	const encoder =
		encoding === "base58" ? getBase58Encoder() : getBase64Encoder();

	return getTransactionDecoder().decode(encoder.encode(encodedTransaction));
}

export async function getTritonPrioritizationFees(writableAccounts: string[]) {
	const response = await fetch(`${process.env.TRITON_RPC}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id: "startup-village",
			jsonrpc: "2.0",
			method: "getRecentPrioritizationFees",
			params: [
				writableAccounts,
				{
					percentile: 7500,
				},
			],
		}),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to get Triton prioritization fees: ${response.statusText}`,
		);
	}

	const data = (await response.json()) as {
		result: { slot: number; prioritizationFee: number }[];
	};

	// Get the average of the 75th percentil of each slot
	const avg = Math.floor(
		data.result.reduce((acc, curr) => acc + curr.prioritizationFee, 0) /
			data.result.length,
	);

	return avg;
}
