import { AnchorProvider } from "@coral-xyz/anchor";
import {
	ACTIONS_CORS_HEADERS,
	ActionPostResponse,
	type ActionGetResponse,
	type ActionPostRequest,
	createPostResponse,
} from "@solana/actions";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { SunriseStakeClient } from "@sunrisestake/client";
import BN from "bn.js";
import { NextRequest } from "next/server";

import { solToLamports } from "@/utils";

async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: ACTIONS_CORS_HEADERS,
	});
}

async function GET() {
	const config: ActionGetResponse = {
		icon: `${process.env.ASSETS_URL}/action-stake.png`,
		title: "Offset carbon while you sleep",
		description:
			"Offset your carbon footprint by staking with Sunrise Stake",
		label: "Offset carbon",
		links: {
			actions: [
				{
					href: `${process.env.ACTIONS_URL}/api/actions/stake?amount=0.1`,
					label: "0.1 SOL",
				},
				{
					href: `${process.env.ACTIONS_URL}/api/actions/stake?amount=0.25`,
					label: "0.25 SOL",
				},
				{
					href: `${process.env.ACTIONS_URL}/api/actions/stake?amount=0.5`,
					label: "0.5 SOL",
				},
				{
					href: `${process.env.ACTIONS_URL}/api/actions/stake?amount={amount}`,
					label: "Stake",
					parameters: [
						{
							name: "amount",
							label: "Enter a custom SOL amount",
							required: true,
						},
					],
				},
			],
		},
	};

	return Response.json(config, {
		status: 200,
		headers: ACTIONS_CORS_HEADERS,
	});
}

async function POST(request: NextRequest) {
	let account: PublicKey;
	try {
		const body: ActionPostRequest = await request.json();
		account = new PublicKey(body.account);
	} catch (error) {
		return Response.json(
			{ message: "Invalid or missing account" },
			{
				status: 400,
				headers: ACTIONS_CORS_HEADERS,
			},
		);
	}

	const parsedUrl = new URL(request.url);
	const params = new URLSearchParams(parsedUrl.search);
	const amount = params.get("amount");
	if (!amount) {
		return Response.json(
			{ message: "Amount is missing" },
			{
				status: 400,
				headers: ACTIONS_CORS_HEADERS,
			},
		);
	}
	let lamports: BN;
	try {
		lamports = solToLamports(amount);
	} catch (error) {
		return Response.json(
			{ message: "Amount is invalid" },
			{
				status: 400,
				headers: ACTIONS_CORS_HEADERS,
			},
		);
	}

	const dummyWallet = {
		publicKey: account,
		signTransaction: () =>
			Promise.reject(new Error("Dummy wallet can't sign")),
		signAllTransactions: () =>
			Promise.reject(new Error("Dummy wallet can't sign")),
	};
	const connection = new Connection(
		process.env.RPC_URL || clusterApiUrl("mainnet-beta"),
	);
	const provider = new AnchorProvider(
		// @ts-ignore - Connection incompatible with Connection ¯\_(ツ)_/¯
		connection,
		dummyWallet,
		{ skipPreflight: true, maxRetries: 0 },
	);
	const client = await SunriseStakeClient.get(
		provider,
		WalletAdapterNetwork.Mainnet,
	);

	const transaction = await client.deposit(lamports, account);
	transaction.recentBlockhash = (
		await connection.getLatestBlockhash()
	).blockhash;
	transaction.feePayer = account;
	const payload: ActionPostResponse = await createPostResponse({
		fields: { transaction },
	});

	return Response.json(
		{ ...payload, message: "Thank you for your support!" },
		{
			status: 200,
			headers: ACTIONS_CORS_HEADERS,
		},
	);
}

export { GET, OPTIONS, POST };
