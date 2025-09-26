// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GreetingCardNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    
    // Minting price (0.0002 ETH)
    uint256 public constant MINT_PRICE = 0.0002 ether;
    
    // Maximum supply
    uint256 public constant MAX_SUPPLY = 10000;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Events
    event GreetingCardMinted(uint256 tokenId, address owner, string tokenURI);
    event BatchMinted(uint256[] tokenIds, address owner);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
    }
    
    // Mint a single greeting card
    function mintGreetingCard(
        string memory uri,
        address recipient
    ) external payable returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIds < MAX_SUPPLY, "Max supply reached");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, uri);
        
        emit GreetingCardMinted(newTokenId, recipient, uri);
        
        return newTokenId;
    }
    
    // Batch mint multiple greeting cards
    function batchMintGreetingCards(
        string[] memory tokenURIs,
        address recipient
    ) external payable returns (uint256[] memory) {
        uint256 totalCost = MINT_PRICE * tokenURIs.length;
        require(msg.value >= totalCost, "Insufficient payment");
        require(_tokenIds + tokenURIs.length <= MAX_SUPPLY, "Exceeds max supply");
        
        uint256[] memory newTokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;
            
            _safeMint(recipient, newTokenId);
            _setTokenURI(newTokenId, tokenURIs[i]);
            
            newTokenIds[i] = newTokenId;
        }
        
        emit BatchMinted(newTokenIds, recipient);
        
        return newTokenIds;
    }
    
    // Withdraw contract balance
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Set base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}