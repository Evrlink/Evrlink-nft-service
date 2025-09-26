import pkg from "hardhat";
const { ethers } = pkg;

const DEFAULT_CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const DEFAULT_TOKEN_URI = "ipfs://QmYourMetadataHash";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS;
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("GreetingCardNFT", contractAddress, signer);

  const tokenURI = process.env.TOKEN_URI ?? DEFAULT_TOKEN_URI;
  const mintPrice = await contract.MINT_PRICE();

  console.log("Minting greeting card...");
  console.log("Token URI:", tokenURI);
  console.log("Recipient:", signer.address);
  console.log("Mint price:", ethers.formatEther(mintPrice), "ETH");

  const tx = await contract.mintGreetingCard(tokenURI, signer.address, {
    value: mintPrice,
  });

  const receipt = await tx.wait();
  console.log("Greeting card minted successfully!");
  console.log("Transaction hash:", receipt?.hash ?? tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
