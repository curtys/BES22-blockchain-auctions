const dotenv = require('dotenv');
const ContractController = require('../controllers/contract-controller');
const RedisConnector = require('../connectors/redis-connector');
const AuctionController = require('../controllers/auction-controller');

function loadConfig() {
    dotenv.config();
    return {
        port: process.env.NODE_PORT,
        prettyLog: process.env.NODE_ENV == 'development',

        redis: {
            hostname: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        },

        web3: {
            host: process.env.WEB3_PROVIDER_HOST,
            port: process.env.WEB3_PROVIDER_PORT,
            account: process.env.WEB3_ACCOUNT
        }
    };
}

class Container {
    constructor(config, redis, contractController, auctionController) {
        this.config = config;
        this.redis = redis;
        this.contractController = contractController;
        this.auctionController = auctionController;
    }

    static async init() {
        const config = loadConfig();
        const redis = new RedisConnector(config.redis.hostname, config.redis.port);
        const contractController = new ContractController(config.web3.host, config.web3.port, config.web3.account);
        const auctionController = new AuctionController(redis, contractController);
        return new Container(config, redis, contractController, auctionController);
    }
}

module.exports = Container;