import pkg from "hardhat";
const { ethers } = pkg;

import { mintGreetingCard } from "./lib/mint-greeting-card.ts";

const DEFAULT_CONTRACT_ADDRESS = "0xF2Cf287F29B945A622Ef41189cfF278f88934a37";
const DEFAULT_TOKEN_URI = "https://amaranth-quiet-dragonfly-382.mypinata.cloud/ipfs/bafkreicdn7r5lwfcec7pmec7hdy4lxd2b7rtqpnr2y4ronc2kee6xqan24";

export interface RunMintOptions {
  contractAddress?: string;
  tokenURI?: string;
  recipient?: string;
}

export async function runMint({
  contractAddress: providedAddress,
  tokenURI: providedTokenURI,
  recipient: providedRecipient,
}: RunMintOptions = {}) {
  const contractAddress = providedAddress ?? process.env.CONTRACT_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS;
  const tokenURI = providedTokenURI ?? process.env.TOKEN_URI ?? DEFAULT_TOKEN_URI;

  const [signer] = await ethers.getSigners();
  const recipient = providedRecipient ?? signer.address;

  console.log("Minting greeting card...");
  console.log("Contract:", contractAddress);
  console.log("Recipient:", recipient);
  console.log("Token URI:", tokenURI);

  const result = await mintGreetingCard({
    contractAddress,
    tokenURI,
    recipient,
    signer,
  });

  console.log("Mint price:", ethers.formatEther(result.mintPrice), "ETH");
  console.log("Greeting card minted successfully!");
  console.log("Transaction hash:", result.transactionHash);

  if (result.tokenId !== undefined) {
    console.log("Token ID:", result.tokenId.toString());
  }

  return result;
}

async function main() {
  await runMint();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
