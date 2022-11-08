const express = require('express');
const router = express.Router();
const Auction = require('../models/auction');

router.get('/ping', (req, res) => {
    res.sendStatus(200);
});

router.post('/auctions', async (req, res) => {
    const auction = req.body;
    console.debug(auction);
    try {
        const id = await container(req).auctionController.createAuction(auction);
        res.contentType('text/plain');
        res.send(id);
    } catch (error) {
        handleError(error, res);
    }
});

router.get('/auctions/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.sendStatus(400);
        return;
    }
    try {
        const result = await container(req).auctionController.getAuction(id);
        if (!result) {
            res.sendStatus(404);
            return;
        }
        res.send(result);

    } catch (error) {
        handleError(error, res);
    }
});

router.post('/auctions/:id/bid', async (req, res) => {
    const id = req.params.id;
    const bid = req.body;
    if (!id || !bid || !bid.user || !bid.amount) {
        res.sendStatus(400);
        return;
    }

    try {
        const result = await container(req).auctionController.bidOnAuction(id, bid)
        if (!result) {
            res.sendStatus(404);
            return;
        }
        console.debug(result);
        res.send(result);
    } catch (error) {
        handleError(error, res);
    }
});

router.post('/auctions/:id/close', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await container(req).auctionController.closeAuction(id);
        if (!result) {
            res.sendStatus(404);
            return;
        }
        res.sendStatus(204);
    } catch (error) {
        handleError(error, res);
    }
});

router.get('/auctions', async (req, res) => {
    try {
        const result = await container(req).auctionController.getAuctions();
        res.send(result);
    } catch (error) {
        handleError(error, res);
    }
});

router.get('/auctions/user/:uname/seller', async (req, res) => {
    auctionsOfUser(req, res, 'seller');
});

router.get('/auctions/user/:uname/bidder', async (req, res) => {
    auctionsOfUser(req, res, 'bidder');
});

async function auctionsOfUser(req, res, role) {
    try {
        const uname = req.params.uname;
        if (!uname) {
            res.sendStatus(400);
            return;
        }
        const result = await container(req).auctionController.getAuctionsOfUser(uname, role);
        res.send(result);
    } catch (error) {
        handleError(error, res);
    }
} 

function container(req) {
    return req.app.locals.container;
}

function handleError(error, res) {
    console.error(error.stack);
    res.sendStatus(500);
}

module.exports = router;