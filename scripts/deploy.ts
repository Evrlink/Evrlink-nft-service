import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    console.log("Starting deployment (ethers)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // If your NFT constructor is (name, symbol, owner)
    const GreetingCardNFT = await ethers.getContractFactory("GreetingCardNFT");
    const nft = await GreetingCardNFT.deploy(
        "Evrlink Greeting Cards",
        "EVRLINK",
        deployer.address // <-- DO NOT use 0x0; OZ Ownable will revert
    );
    await nft.waitForDeployment();

    console.log("GreetingCardNFT deployed to:", await nft.getAddress());
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});