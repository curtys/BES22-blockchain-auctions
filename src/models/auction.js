class Auction {
    id = '';
    seller = '';
    title = '';
    description = '';
    highestBidder = '';
    amount;
    endTime;
    closed = false;
    duration;


    constructor(obj) {
        Object.assign(this, obj);
    }
}

module.exports = Auction;