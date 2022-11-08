const truffleContract = require('@truffle/contract');
const contractData = require('../../build/contracts/Auction.json');
const Auction = require('../models/auction');
const BidResult = require('../models/bid-result');
const Web3 = require('web3');

class ContractController {

    errors = {
        INVALID_ADDRESS_FORMAT: 'invalid-address-format',
        NOT_FOUND: 'not-found',
        CONNECTION: 'connection-error',
        REVERT_TRANSACTION: 'revert-transaction',
        UNKNOWN: 'unknown'
    }

    constructor(web3providerHost, web3ProviderPort, account) {
        this._web3provider = new Web3.providers.HttpProvider(`${web3providerHost}:${web3ProviderPort}`);
        this._web3 = new Web3(this._web3provider);
        this._contract = truffleContract(contractData);
        this._contract.setProvider(this._web3provider);
        this._contract.defaults({from: account});
        this._account = account;
        console.debug(`Using Web3 provider ${this._web3provider}`);
    }
    
    async newContract(auction) {
        this._unlock();
        const instance = await this._contract.new(auction.seller, auction.title, 
            auction.description, auction.duration);
        console.debug(`Created new auction at ${instance.address}`);
        return instance.address;
    }

    async getContractInformation(address, instance, update) {
        this._unlock();
        instance = instance || await this._contract.at(address);
        if (!!update) {
            await this._updateAuctionState(instance);
        }
        const result = await instance.getInformation();
        const auction = new Auction({seller: result['0'], title: result['1'], 
            description: result['2'], highestBidder: result['3'], amount: result['4'].toNumber(),
            endTime: result['5'].toNumber(), closed: result['6']});
        auction.id = address;
        console.debug(`Retrieved contract information at address ${address}:`);
        console.debug(auction);
        return auction;
    }

    async placeBid(address, bid) {
        this._unlock();
        const instance = await this._contract.at(address);
        const result = await instance.bid(bid.user, bid.amount);
        const event = this._extractEvent(result);
        const auction = await this.getContractInformation(address, instance, true);
        const bidResult = new BidResult({accepted: event.args.accepted, auction: auction})
        return bidResult;
    }

    async closeAuction(address) {
        this._unlock();
        const instance = await this._contract.at(address);
        const result = await instance.close();
        return result;
    }

    errorType(truffleError) {
        if (truffleError.message && truffleError.message.includes('Invalid address')) {
            return this.errors.INVALID_ADDRESS_FORMAT;
        }
        if (truffleError.message && truffleError.message.includes('no code at address')) {
            return this.errors.NOT_FOUND;
        }
        if (truffleError.message && truffleError.message.includes('revert')) {
            return this.errors.REVERT_TRANSACTION;
        }
        return this.errors.UNKNOWN;
    }

    _extractEvent(transactionResult) {
        if (transactionResult.logs && transactionResult.logs.length > 0) {
            return transactionResult.logs[0];
        }
        return null;
    }

    async _updateAuctionState(instance) {
        await instance.updateState();
    }

    _unlock() {
        if (process.env.WEB3_ACCOUNT_PASSWORD) {
            console.debug(`-> Unlocking account ${this._account}`);
            this._web3.eth.personal.unlockAccount(this._account, process.env.WEB3_ACCOUNT_PASSWORD);
        }
    }

}

module.exports = ContractController;