import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

const solToLamports = (sol: number | string): BN => {
	// handle very big numbers but also integers.
	// note this doesn't handle large numbers with decimals.
	// in other words, if you ask for eg a withdrawal of 1e20 SOL + 0.1 SOL, it will round that to 1e20 SOL.TODO fix this later.
	// Math.floor does not work nicely with very large numbers, so we use string formatting (!) to remove the decimal point.

	const formattedNum =
		typeof sol === "string" && Number(sol) > 1_000_000_000
			? (
					BigInt(sol.replace(/\..*$/, "")) * BigInt(LAMPORTS_PER_SOL)
				).toString()
			: Math.floor(Number(sol) * LAMPORTS_PER_SOL).toString();

	// cast to string to avoid error with BN if the number is too high
	return new BN(formattedNum);
};

export { solToLamports };
