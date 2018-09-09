require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');
const { wallet, endpoint } = process.env;

/* Initialize new provider */
const provider = new HDWalletProvider(
  wallet,
  endpoint
);

/* Initialize new Web3 instance with provider */
const web3 = new Web3(provider);

/* Deploy to Rinkeby network */
const deploy = async () => {

  /* Get a list of test accounts */
  const accounts = await web3.eth.getAccounts();

  /* Deploy a contract with one of the accounts */
  console.log('attempting to deploy from account: ', accounts[0]);
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  console.log('deployed to ', lottery.options.address);

  lottery.setProvider(provider);
}

deploy();
