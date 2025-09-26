// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockEntryPoint is Ownable {
    mapping(address => uint256) public balanceOf;
    
    constructor() Ownable(msg.sender) {}
    
    function depositTo(address account) external payable {
        balanceOf[account] += msg.value;
    }
    
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external {
        require(balanceOf[msg.sender] >= withdrawAmount, "Insufficient balance");
        balanceOf[msg.sender] -= withdrawAmount;
        (bool success, ) = withdrawAddress.call{value: withdrawAmount}("");
        require(success, "Withdrawal failed");
    }
}
