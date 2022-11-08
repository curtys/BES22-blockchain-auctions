class BidResult {
    accepted = false;
    reason;
    auction;

    constructor(obj) {
        Object.assign(this, obj);
    }
}

module.exports = BidResult;