import { HardhatRuntimeEnvironment } from "hardhat/types";

async function main(hre: HardhatRuntimeEnvironment) {
  console.log("Test script running...");
  console.log("Network:", hre.network.name);
  console.log("Hardhat version:", hre.version);
}

export default main;

