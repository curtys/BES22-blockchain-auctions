// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8;

// Small contract for inheriting the function modifier 'restricted'
contract restrictedByOwner {
    constructor() { owner = payable(msg.sender); }
    address payable owner;

    // A function modifier that asserts that the function caller (the sender) is the owner,
    // i.e. the entity that created the contract.
    modifier restricted {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
}

// Alternative to Auction.sol. This serves as registry were all auctions are recorded. 
// Thus only this contract needs to be deployed.
contract AuctionRegistry is restrictedByOwner {

    // Grouping of data associated with a bid
    struct Bid {
        string bidder;
        uint64 amount;
        bool accepted;
    }

    struct Auction {
        string seller;
        string title;
        string description;
        bool closed;
        uint endTime;
        Bid currentBid;
    }

    mapping (uint => Auction) auctions;
    mapping (uint => Bid[]) bids;

    event BidReceived(uint auctionId, string bidder, uint64 amount, bool accepted, uint bidId);
    event AuctionClosed(uint auctionId, string winner, uint64 amount);

    function newAuction(uint auctionId, string memory _seller, string memory _title, string memory _description, uint _duration) public {
        uint endTime = block.timestamp + (_duration * 1 minutes);
        auctions[auctionId] = Auction(_seller, _title, _description, false, endTime, Bid("none", 0, false));
    }

    // Returns the information about the auctions current state
    function getInformation(uint auctionId) public view restricted returns (string memory, string memory,
        string memory, string memory, uint, uint, bool) {
        return (auctions[auctionId].seller, auctions[auctionId].title, auctions[auctionId].description, 
            auctions[auctionId].currentBid.bidder, auctions[auctionId].currentBid.amount, 
            auctions[auctionId].endTime, auctions[auctionId].closed);
    }

    // Place a bid. The auction must not be closed and the seller is not allowed to bid.
    // The bid is accepted if it is currently the highest bid. In any case, the bid is mapped
    // and a BidReceived event is emitted.
    function bid(uint auctionId, string memory bidder, uint64 amount) public restricted {
        // The auction must not be closed. The transaction is reverted when a require does not hold.
        require(!isClosed(auctionId), "auction is closed");
        // The bidder must not be the seller.
        require(
            (keccak256(bytes(auctions[auctionId].seller)) != keccak256(bytes(bidder))),
            "seller cannot bid"
        );

        // a bid is considered as accepted if the offered bid amount is greater than the current amount
        bool accepted = (amount > auctions[auctionId].currentBid.amount);

        Bid memory newBid = Bid(bidder, amount, accepted);
        bids[auctionId].push(newBid);

        // if the new bid has been accepted, it is set as the current highest bid
        if (accepted) auctions[auctionId].currentBid = newBid;
        // the event is emitted in any case
        emit BidReceived(auctionId, bidder, amount, accepted, bids[auctionId].length);
        // check if the auction has ended and update the internal state if so
        checkState(auctionId);
    }

    // closes the auction if the auction has ended,
    // i.e. the auctions was open for the duration set at creation
    function checkState(uint auctionId) public restricted {
        if (!isClosed(auctionId) && block.timestamp > auctions[auctionId].endTime) {
            close(auctionId);
        }
    }

    // check if the auction has already been closed or has ended
    function isClosed(uint auctionId) public view restricted returns (bool) {
        return auctions[auctionId].endTime == 0 || auctions[auctionId].closed || block.timestamp > auctions[auctionId].endTime;
    }

    // close the auction and emit the AuctionClosed event
    function close(uint auctionId) public restricted {
        require(auctions[auctionId].endTime != 0, "Auction does not exist");
        auctions[auctionId].closed = true;
        emit AuctionClosed(auctionId, auctions[auctionId].currentBid.bidder, auctions[auctionId].currentBid.amount);
    }
}