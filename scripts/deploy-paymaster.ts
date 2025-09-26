import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying GreetingCardPaymaster...");

    // Get the contract factories
  const GreetingCardNFT = await ethers.getContractFactory("GreetingCardNFT");
  const GreetingCardPaymaster = await ethers.getContractFactory("GreetingCardPaymaster");

  // Deploy parameters
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // USDC contract addresses for different networks
  const USDC_ADDRESSES = {
    // Base Mainnet USDC
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    // Base Sepolia USDC (testnet)
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    // Ethereum Mainnet USDC
    mainnet: "0xA0b86a33E6441b8c4C8C0C4C8C0C4C8C0C4C8C0C",
    // Sepolia USDC (testnet)
    sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  };

  // EntryPoint contract addresses
  const ENTRYPOINT_ADDRESSES = {
    base: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    baseSepolia: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    mainnet: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    sepolia: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
  };

  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;

  // Select addresses based on network
  const usdcAddress = USDC_ADDRESSES[networkName as keyof typeof USDC_ADDRESSES] || USDC_ADDRESSES.sepolia;
  const entryPointAddress = ENTRYPOINT_ADDRESSES[networkName as keyof typeof ENTRYPOINT_ADDRESSES] || ENTRYPOINT_ADDRESSES.sepolia;

  console.log(`Network: ${networkName}`);
  console.log(`USDC Address: ${usdcAddress}`);
  console.log(`EntryPoint Address: ${entryPointAddress}`);

  // Deploy GreetingCardNFT first
  console.log("Deploying GreetingCardNFT...");
  const nftContract = await GreetingCardNFT.deploy(
    "GreetingCardNFT",
    "GCNFT",
    deployer.address,
    usdcAddress
  );
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("GreetingCardNFT deployed to:", nftAddress);

  // Deploy GreetingCardPaymaster
  console.log("Deploying GreetingCardPaymaster...");
  const paymaster = await GreetingCardPaymaster.deploy(
    usdcAddress,
    nftAddress,
    deployer.address
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("GreetingCardPaymaster deployed to:", paymasterAddress);

  // Set paymaster in NFT contract
  console.log("Setting paymaster in NFT contract...");
  const setPaymasterTx = await nftContract.setPaymaster(paymasterAddress);
  await setPaymasterTx.wait();
  console.log("Paymaster set successfully");

  // Send ETH to paymaster for gas sponsorship
  console.log("Sending ETH to paymaster...");
  const depositAmount = ethers.parseEther("1.0"); // 1 ETH for gas sponsorship
  const depositTx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: depositAmount
  });
  await depositTx.wait();
  console.log(`Sent ${ethers.formatEther(depositAmount)} ETH to paymaster`);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Deployer:", deployer.address);
  console.log("GreetingCardNFT:", nftAddress);
  console.log("GreetingCardPaymaster:", paymasterAddress);
  console.log("USDC Token:", usdcAddress);
  console.log("EntryPoint:", entryPointAddress);
  console.log("Paymaster ETH Balance:", ethers.formatEther(await paymaster.getETHBalance()));

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Test USDC minting with a smart account");
  console.log("3. Monitor paymaster ETH balance and top up as needed");
  console.log("4. Set up monitoring for USDC collections");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
