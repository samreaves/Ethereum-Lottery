const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');
const INITIAL_MESSAGE = 'Hi there';

/* Initialize test variables */
let accounts;
let lottery;

beforeEach(async () => {
  /* Get a list of test accounts */
  accounts = await web3.eth.getAccounts();

  /* Deploy a contract with one of the accounts */
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  lottery.setProvider(provider);
});

describe('Lottery', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows multiple accounts to enter lottery' , async () => {

    /* Enter the lottery with two players*/
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    /* Grab players using manager account */
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    /* Players array contains two addresses */
    assert.equal(2, players.length);
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
  });

  it('requires a minimum amount of 0.01 ether to enter', async () => {
    try {
      await lottery.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.009', 'ether')
      });
      assert(false);
    } catch (enterLotteryError) {
      assert(enterLotteryError);
    }
  });

  it('will only allow a manager to pick a winner', async () => {

    /* From a non manager */
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      })
      assert(false);
    } catch (pickWinnerFromNonManagerError) {
      assert(pickWinnerFromNonManagerError);
    }

    /* From the manager (who initially deployed the contract to the blockchain) */
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[0]
      });
      assert(true);
    } catch (pickWinnerFromManagerError) {
      assert(pickWinnerFromManagerError);
    }
  });

  it('sends money to the winner and empties the player array after lottery winner picked', async () => {

    /* Players array is empty at start */
     const initialPlayers = await lottery.methods.getPlayers().call({
       from: accounts[0]
     });

    assert(initialPlayers.length === 0);

    /* Player 1 enters sending 2 ether into lottery */
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    });

    /* Get balance of account after wager, prior to lottery distribution */
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    /* Players array not empty while lottery active and player has entered */
    const playersWhileLotteryIsActive = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert(playersWhileLotteryIsActive.length === 1);

    /* Winner is picked */
    await lottery.methods.pickWinner().send({
      from: accounts[0]
    });

    /* Balance contains winnings after lottery distribution */
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei('1.8', 'ether'));

    /* Players array is empty after winner is picked */
    const  finalPlayers = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert(finalPlayers.length === 0);
  });
});
