const Redis = require("ioredis");

class RedisConnector {
    constructor(hostname, port) {
        this._redis = new Redis({port: port, host: hostname});
    }

    async addHash(namespace, id, obj) {
        const h_key = `${namespace}:${id}`;
        const result = await this._redis.hmset(h_key, obj);
        return this._isSuccess(result);
    }

    async getHash(namespace, id) {
        const h_key = `${namespace}:${id}`;
        return this._redis.hgetall(h_key);
    }

    async getHashField(namespace, id, field) {
        const h_key = `${namespace}:${id}`;
        return this._redis.hget(h_key, field);
    }

    async setHashField(namespace, id, field, value) {
        const h_key = `${namespace}:${id}`;
        const result = this._redis.hset(h_key, field, value);
        return this._isSuccess(result);
    }

    async addSet(namespace, id, obj) {
        const s_key = `${namespace}:${id}`;
        const result = await this._redis.sadd(s_key, obj);
        return this._isSuccess(result);
    }

    async getSet(namespace, id) {
        const s_key = `${namespace}:${id}`;
        return this._redis.smembers(s_key);
    }

    async removeFromSet(namespace, id, obj) {
        const s_key = `${namespace}:${id}`;
        const result = await this._redis.srem(s_key, obj);
        return this._isSuccess(result);
    }

    async existsHash(namespace, id) {
        const h_key = `${namespace}:${id}`;
        const len = await this._redis.hlen(h_key);
        return len > 0;
    }

    async clearHashField(namespace, id, field) {
        const h_key = `${namespace}:${id}`;
        await this._redis.hdel(h_key, field);
    }

    async deleteKey(namespace, id) {
        const key = `${namespace}:${id}`;
        const result = await this._redis.del(key);
        return this._isSuccess(result);
    }

    getIdFromKey(key) {
        return key.split(':')[1];
    }

    _isSuccess(result) {
        return result > 0 || result === 'OK';
    }

    _isDefined(object) {
        return object != undefined && object != null && !!Object.keys(object).length;
    }
}

module.exports = RedisConnector;