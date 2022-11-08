const Auction = artifacts.require("Auction");
const truffleAssert = require('truffle-assertions');

contract('Auction', async accounts => {
  // deployment to the test network is done automatically by the migration scripts
  it('should have matching information', async () => {
    const instance = await Auction.deployed();
    const information = await instance.getInformation();

    assert.equal(information['0'], "janedoe");
    assert.equal(information['1'], "test-auction");
    assert.equal(information['2'], "Auction contract for testing.");
    assert.empty(information['3']);
    assert.equal(information['4'], 0);
    assert.equal(information['6'], false);
  });
  it('should accept bid', async () => {
    const instance = await Auction.deployed();
    const response = await instance.bid('john', 1000);
    const information = await instance.getInformation.call();
    assert.equal(information['3'], 'john');
    assert.equal(information['4'], 1000);

    truffleAssert.eventEmitted(response, 'BidReceived', (event) => {
      return event.bidder == 'john' && event.amount == 1000 && event.bidId == 0;
    });

  });
  it('should not accept bid from seller', async () => {
    const instance = await Auction.deployed();
    let expected;
    try {
      await instance.bid('janedoe', 1000);
    } catch (error) {
      expected = error;
    }
    assert.isNotNull(expected);
  });
  it('should not accept bid when closed', async () => {
    const instance = await Auction.deployed();
    await instance.setClosed(false);
    let expected;
    try {
      await instance.bid('john', 1000);
    } catch (error) {
      expected = error;
    }
    assert.isNotNull(expected);
  });
  it('should emit event when closed', async () => {
    const instance = await Auction.deployed();
    await instance.setClosed(false);
    const response = await instance.close();
    truffleAssert.eventEmitted(response, 'AuctionClosed', (event) => {
      return event.winner == 'john' && event.amount == 1000;
    });
    const information = await instance.getInformation.call();
    assert.equal(information['6'], true);

  });

});
