// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8;

// Small contract for inheriting the function modifier 'restricted'
contract owned {
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

// This contract inherits the 'restricted' function modifier from the contract 'owned'
// See "AuctionRegistry.sol" for a version that manages multiple auctions.
contract Auction is owned {

    // Grouping of data associated with a bid
    struct Bid {
        string bidder;
        uint64 amount;
        bool accepted;
    }

    // State variables with the visibility modifier 'internal' can only be accessed
    // from the current contract or contracts deriving from it
    string internal seller;
    string internal title;
    string internal description;
    Bid internal currentBid;
    bool internal closed = false;
    uint internal endTime;

    uint internal numBids = 0;
    mapping (uint => Bid) bids;

    event BidReceived(string bidder, uint64 amount, bool accepted, uint bidId);
    event AuctionClosed(string winner, uint64 amount);

    // The constructor function is called when creating a contract. The given parameters are assined to the state variables.
    // Duration is expected to be in minutes.
    constructor(string memory _seller, string memory _title, string memory _description, uint _duration) {
        seller = _seller;
        title = _title;
        description = _description;
        endTime = block.timestamp + (_duration * 1 minutes);
    }

    // Returns the information about the auctions current state
    function getInformation() public view restricted returns (string memory, string memory,
        string memory, string memory, uint, uint, bool) {
        return (seller, title, description, currentBid.bidder, currentBid.amount, endTime, closed);
    }

    // Place a bid. The auction must not be closed and the seller is not allowed to bid.
    // The bid is accepted if it is currently the highest bid. In any case, the bid is mapped
    // and a BidReceived event is emitted.
    function bid(string memory bidder, uint64 amount) public restricted {
        // The auction must not be closed. The transaction is reverted when a require does not hold.
        require(!isClosed(), "auction is closed");
        // The bidder must not be the seller.
        require(
            (keccak256(bytes(seller)) != keccak256(bytes(bidder))),
            "seller cannot bid"
        );

        uint bidId = numBids++;
        // a bid is considered as accepted if the offered bid amount is greater than the current amount
        bool accepted = (amount > currentBid.amount);

        Bid memory newBid = Bid(bidder, amount, accepted);
        bids[bidId] = newBid;

        // if the new bid has been accepted, it is set as the current highest bid
        if (accepted) currentBid = newBid;
        // the event is emitted in any case
        emit BidReceived(bidder, amount, accepted, bidId);
        // check if the auction has ended and update the internal state if so
        updateState();
    }

    // closes the auction if the auction has ended,
    // i.e. the auctions was open for the duration set at creation
    function updateState() public restricted {
        if (!closed && isClosed()) {
            close();
        }
    }

    // check if the auction has already been closed or has ended
    function isClosed() public view restricted returns (bool) {
        return closed || block.timestamp > endTime;
    }

    // close the auction and emit the AuctionClosed event
    function close() public restricted {
        closed = true;
        emit AuctionClosed(currentBid.bidder, currentBid.amount);
    }

    // function for testing
    function setClosed(bool a) external restricted { closed = a; }
}