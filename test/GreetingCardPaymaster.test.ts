import { expect } from "chai";
import { ethers } from "hardhat";
import { GreetingCardNFT, GreetingCardPaymaster } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GreetingCardPaymaster Integration", function () {
  let nftContract: GreetingCardNFT;
  let paymaster: GreetingCardPaymaster;
  let usdcToken: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let entryPoint: any;

  // Mock USDC token for testing
  const USDC_MINT_PRICE = 50 * 10**6; // $50 USDC
  const MOCK_USDC_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdcToken = await MockUSDC.deploy();
    await usdcToken.waitForDeployment();

    // Deploy mock EntryPoint
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    entryPoint = await MockEntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // Deploy GreetingCardNFT
    const GreetingCardNFT = await ethers.getContractFactory("GreetingCardNFT");
    nftContract = await GreetingCardNFT.deploy(
      "GreetingCardNFT",
      "GCNFT",
      owner.address,
      await usdcToken.getAddress()
    );
    await nftContract.waitForDeployment();

    // Deploy GreetingCardPaymaster
    const GreetingCardPaymaster = await ethers.getContractFactory("GreetingCardPaymaster");
    paymaster = await GreetingCardPaymaster.deploy(
      await entryPoint.getAddress(),
      await usdcToken.getAddress(),
      await nftContract.getAddress(),
      owner.address
    );
    await paymaster.waitForDeployment();

    // Set paymaster in NFT contract
    await nftContract.setPaymaster(await paymaster.getAddress());

    // Mint USDC to user for testing
    await usdcToken.mint(user.address, MOCK_USDC_SUPPLY);
    
    // User approves paymaster to spend USDC
    await usdcToken.connect(user).approve(await paymaster.getAddress(), MOCK_USDC_SUPPLY);

    // Deposit ETH to paymaster for gas sponsorship
    await paymaster.deposit({ value: ethers.parseEther("1.0") });
  });

  describe("Paymaster Configuration", function () {
    it("Should set correct USDC price", async function () {
      expect(await paymaster.USDC_MINT_PRICE()).to.equal(USDC_MINT_PRICE);
    });

    it("Should have correct NFT contract address", async function () {
      expect(await paymaster.nftContract()).to.equal(await nftContract.getAddress());
    });

    it("Should have correct USDC token address", async function () {
      expect(await paymaster.usdcToken()).to.equal(await usdcToken.getAddress());
    });
  });

  describe("USDC Minting", function () {
    it("Should mint NFT with USDC payment", async function () {
      const tokenURI = "https://example.com/metadata/1";
      const usdcAmount = USDC_MINT_PRICE;

      // Simulate paymaster calling mintWithUSDC
      const mintTx = await nftContract.connect(owner).mintWithUSDC(
        tokenURI,
        user.address,
        usdcAmount
      );

      await expect(mintTx)
        .to.emit(nftContract, "USDCGreetingCardMinted")
        .withArgs(1, user.address, tokenURI, usdcAmount);

      // Check NFT ownership
      expect(await nftContract.ownerOf(1)).to.equal(user.address);
      expect(await nftContract.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should reject insufficient USDC payment", async function () {
      const tokenURI = "https://example.com/metadata/1";
      const insufficientAmount = USDC_MINT_PRICE - 1;

      await expect(
        nftContract.connect(owner).mintWithUSDC(
          tokenURI,
          user.address,
          insufficientAmount
        )
      ).to.be.revertedWith("Insufficient USDC payment");
    });

    it("Should reject non-paymaster calls", async function () {
      const tokenURI = "https://example.com/metadata/1";
      const usdcAmount = USDC_MINT_PRICE;

      await expect(
        nftContract.connect(user).mintWithUSDC(
          tokenURI,
          user.address,
          usdcAmount
        )
      ).to.be.revertedWith("Only paymaster can call this function");
    });
  });

  describe("Batch USDC Minting", function () {
    it("Should batch mint NFTs with USDC payment", async function () {
      const tokenURIs = [
        "https://example.com/metadata/1",
        "https://example.com/metadata/2",
        "https://example.com/metadata/3"
      ];
      const totalUsdcAmount = USDC_MINT_PRICE * tokenURIs.length;

      const batchMintTx = await nftContract.connect(owner).batchMintWithUSDC(
        tokenURIs,
        user.address,
        totalUsdcAmount
      );

      await expect(batchMintTx)
        .to.emit(nftContract, "BatchMinted");

      // Check all NFTs are minted
      for (let i = 0; i < tokenURIs.length; i++) {
        expect(await nftContract.ownerOf(i + 1)).to.equal(user.address);
        expect(await nftContract.tokenURI(i + 1)).to.equal(tokenURIs[i]);
      }
    });
  });

  describe("Paymaster Management", function () {
    it("Should allow owner to deposit ETH", async function () {
      const depositAmount = ethers.parseEther("0.5");
      const initialBalance = await paymaster.getDeposit();

      await paymaster.deposit({ value: depositAmount });

      expect(await paymaster.getDeposit()).to.equal(initialBalance + depositAmount);
    });

    it("Should allow owner to withdraw ETH", async function () {
      const withdrawAmount = ethers.parseEther("0.1");
      const initialBalance = await paymaster.getDeposit();

      await paymaster.withdraw(withdrawAmount);

      expect(await paymaster.getDeposit()).to.equal(initialBalance - withdrawAmount);
    });

    it("Should allow owner to withdraw USDC", async function () {
      // First, simulate USDC collection by transferring to paymaster
      await usdcToken.connect(user).transfer(await paymaster.getAddress(), USDC_MINT_PRICE);
      
      const initialBalance = await usdcToken.balanceOf(owner.address);
      await paymaster.withdrawUSDC(USDC_MINT_PRICE);
      
      expect(await usdcToken.balanceOf(owner.address)).to.equal(initialBalance + USDC_MINT_PRICE);
    });
  });

  describe("Gas Sponsorship", function () {
    it("Should have sufficient ETH for gas sponsorship", async function () {
      const deposit = await paymaster.getDeposit();
      expect(deposit).to.be.greaterThan(0);
    });

    it("Should track USDC balance", async function () {
      const usdcBalance = await paymaster.getUSDCBalance();
      expect(usdcBalance).to.equal(0); // Initially zero
    });
  });
});

// Mock contracts for testing
describe("Mock Contracts", function () {
  it("Should deploy MockUSDC", async function () {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    
    expect(await mockUSDC.getAddress()).to.be.properAddress;
  });

  it("Should deploy MockEntryPoint", async function () {
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    const mockEntryPoint = await MockEntryPoint.deploy();
    await mockEntryPoint.waitForDeployment();
    
    expect(await mockEntryPoint.getAddress()).to.be.properAddress;
  });
});
