const Auction = artifacts.require("Auction");

module.exports = function(deployer) {
  deployer.deploy(Auction, "janedoe", "test-auction", "Auction contract for testing.", 3);
};
