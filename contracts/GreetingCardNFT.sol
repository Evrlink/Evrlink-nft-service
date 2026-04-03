// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title GreetingCardNFT
/// @notice ERC-721 greeting cards on Base, minted for USDC. Default price is $1.00 (1e6 units, 6 decimals).
/// @dev Production on Base mainnet should use USDC at 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913.
contract GreetingCardNFT is ERC721, ERC721URIStorage, ERC721Pausable, Ownable {
    using SafeERC20 for IERC20;

    /// @notice USDC token (6 decimals on Base).
    IERC20 public immutable usdc;

    /// @notice Mint price in USDC smallest units (6 decimals). Default 1_000_000 = $1.00.
    uint256 public price;

    /// @notice $1.00 in USDC (6 decimals).
    uint256 public constant ONE_USDC = 1_000_000;

    uint256 private _tokenIds;

    /// @notice Recipient recorded at mint for each token (the address that received the NFT).
    mapping(uint256 tokenId => address) public cardRecipient;

    event CardMinted(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed recipient,
        string tokenURI
    );

    constructor(string memory name_, string memory symbol_, address initialOwner, address usdc_)
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        require(usdc_ != address(0), "GreetingCardNFT: zero USDC");
        usdc = IERC20(usdc_);
        price = ONE_USDC;
    }

    /// @notice Mint one card. Caller must have approved this contract to spend `price` USDC.
    function mintGreetingCard(string memory uri, address recipient) external returns (uint256) {
        address sender = msg.sender;
        usdc.safeTransferFrom(sender, owner(), price);

        unchecked {
            ++_tokenIds;
        }
        uint256 tokenId = _tokenIds;

        cardRecipient[tokenId] = recipient;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit CardMinted(tokenId, sender, recipient, uri);
        return tokenId;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
