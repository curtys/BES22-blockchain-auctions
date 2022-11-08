const BidResult = require('../models/bid-result');

const NS_BIDDER = 'bidders';
const NS_SELLER = 'sellers';
const NS_AUCTION = 'auctions';

class AuctionController {
    constructor(connector, contractController) {
        this._connector = connector;
        this._contractController = contractController;
    }

    async getAuction(id) {
        const exists = await this._connector.existsHash(NS_AUCTION, id);
        if (!exists) return null;
        const set = new Set();
        set.add(id);
        const auctions = await this._collectAuctionsData(set);
        if (Array.isArray(auctions) && auctions.length > 0) return auctions[0];
        return null;
    }

    async getAuctions(onlyActive) {
        const auctionIds = await this._lookupAuctionIds(NS_AUCTION, 'all', onlyActive);
        if (!(Array.isArray(auctionIds) && auctionIds.length > 0)) return [];
        return await this._collectAuctionsData(auctionIds);
    }

    async getAuctionsOfUser(username, role, onlyActive) {
        let namespace = NS_BIDDER;
        if (role === 'seller') namespace = NS_SELLER;
        const auctionIds = await this._lookupAuctionIds(namespace, username, onlyActive);
        if (!(Array.isArray(auctionIds) && auctionIds.length > 0)) return [];
        return await this._collectAuctionsData(auctionIds);
    }

    async createAuction(auction) {
        const id = await this._contractController.newContract(auction);
        if (!id) throw new Error(`No contract address received.`);
        const success = await this._connector.addHash(NS_AUCTION, id, {active:true});
        let setRes1, setRes2;
        if (success) {
            setRes1 = await this._connector.addSet(NS_AUCTION, 'all', id);
            setRes2 = await this._connector.addSet(NS_SELLER, auction.seller, id);
        }
        if (!success || !setRes1 || !setRes2) {
            throw new Error(`Could not create entries in Redis for auction id ${id}`);
        }
        console.debug(`Mapped auction with id ${id}`);
        return id;
    }

    async bidOnAuction(id, bid) {
        const exists = await this._connector.existsHash(NS_AUCTION, id);
        if (!exists) return null;
        const hash = await this._connector.getHash(NS_AUCTION, id);
        if (!hash.active) return new BidResult({reason: 'auction closed'});

        const errorHandler = this._createErrorHandler(id);
        try {
            const result = await this._contractController.placeBid(id, bid);
            const storageResult = await this._connector.addSet(NS_BIDDER, bid.user, id);
            return result;
        } catch (error) {
            return errorHandler(error);
        }
    }

    async closeAuction(id) {
        const exists = await this._connector.existsHash(NS_AUCTION, id);
        if (!exists) return null;
        const errorHandler = this._createErrorHandler(id);
        try {
            await this._contractController.closeAuction(id);
            const storageResult = await this._connector.setHashField(NS_AUCTION, id, 'active', false);
            const auction = await this._contractController.getContractInformation(id);
            return auction;
        } catch (error) {
            errorHandler(error);
        }
    }

    async _filterActive(set) {
        console.debug('filter active auctions');
        for (const id of set) {
            const active = await this._connector.getHashField(NS_AUCTION, id, 'active');
            if (!!active) activeAuctions.push(id);
        }
    }

    async _lookupAuctionIds(namespace, principal, onlyActive) {
        const auctionIds = await this._connector.getSet(namespace, principal);
        if (!!onlyActive) auctionIds = this._filterActive(auctionIds);
        return auctionIds;
    }

    async _collectAuctionsData(auctionIds, namespace = '', principal = '') {
        const auctions = [];
        for (const id of auctionIds) {
            const errorHandler = this._createErrorHandler(id, namespace, principal);
            const data = await this._retrieveAuctionContractData(id, errorHandler);
            if (!!data) auctions.push(data);
        }
        return auctions;
    }

    async _retrieveAuctionContractData(id, errorHandler) {
        try {
            return await this._contractController.getContractInformation(id, null, true);
        } catch (error) {
            errorHandler(error);
       }
       return null;
    }

    _createErrorHandler(auctionId, namespace, principal) {
        return (error) => {
            const errorType = this._contractController.errorType(error);
            let message = '';
            switch (errorType) {
                case this._contractController.errors.INVALID_ADDRESS_FORMAT:
                    message = `Address ${auctionId} not valid. Removing from storage...`;
                case this._contractController.errors.NOT_FOUND:
                    message =  message || `No contract at address ${auctionId} found. Removing from storage...`;
                    console.error(message);
                    // delete the auction hash
                    this._connector.deleteKey(NS_AUCTION, auctionId);
                    // remove auction id from the overview set
                    this._connector.removeFromSet(NS_AUCTION, 'all', auctionId);
                    // remove auction id from the principal set
                    if (namespace && principal) this._connector.removeFromSet(namespace, principal, auctionId);
                    break;
                case this._contractController.errors.REVERT_TRANSACTION:
                    message = `Transaction requirements not fulfilled. Transaction was reverted: ${error.message} ${auctionId}`;
                    console.error(message);
                    return new BidResult({accepted: false, reason: message});
            
                default:
                    throw error
            }
        }
    }
}

module.exports = AuctionController;