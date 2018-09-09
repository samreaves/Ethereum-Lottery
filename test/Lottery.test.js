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
});
