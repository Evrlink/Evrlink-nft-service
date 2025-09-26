import { ethers } from "ethers";

const GREETING_CARD_ABI = [
  "function MINT_PRICE() view returns (uint256)",
  "function mintGreetingCard(string uri, address recipient) payable returns (uint256)",
  "event GreetingCardMinted(uint256 tokenId, address owner, string tokenURI)"
];

export interface MintGreetingCardParams {
  contractAddress: string;
  tokenURI: string;
  recipient: string;
  signer: ethers.Signer;
}

export interface MintGreetingCardResult {
  transactionHash: string;
  mintPrice: bigint;
  tokenId?: bigint;
}

export async function mintGreetingCard({
  contractAddress,
  tokenURI,
  recipient,
  signer,
}: MintGreetingCardParams): Promise<MintGreetingCardResult> {
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  if (!ethers.isAddress(recipient)) {
    throw new Error(`Invalid recipient address: ${recipient}`);
  }

  const contract = new ethers.Contract(contractAddress, GREETING_CARD_ABI, signer);
  const mintPrice: bigint = await contract.MINT_PRICE();

  const tx = await contract.mintGreetingCard(tokenURI, recipient, {
    value: mintPrice,
  });

  const receipt = await tx.wait();
  const transactionHash = receipt?.hash ?? tx.hash;

  let tokenId: bigint | undefined;
  const iface = new ethers.Interface(GREETING_CARD_ABI);

  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "GreetingCardMinted") {
        tokenId = parsed.args[0] as bigint;
        break;
      }
    } catch {
      // Ignore logs that do not match the ABI
    }
  }

  return {
    transactionHash,
    mintPrice,
    tokenId,
  };
}
