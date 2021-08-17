const { Console } = require('console');
const Web3 = require('web3');
const web3 = new Web3('https://bsc-dataseed1.binance.org:443');

let tokenAddress = "0x682f9f8287da04154ddfe84780cac1d004b36dc6";
let walletAddress = "0xDFE3d9B97Dd9a2C18e54B56a902a31fdf6B368B7";

// Alberto = 0x08FE19440595B26A934bbD747761FbB1eb2640F8
// Teixi = 0xDFE3d9B97Dd9a2C18e54B56a902a31fdf6B368B7
let minABI = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  }
];

const contract = new web3.eth.Contract(minABI, tokenAddress);
  async function getBalance() {
    const result = await contract.methods.balanceOf(walletAddress).call(); // 29803630997051883414242659
    const format = web3.utils.fromWei(result); // 29803630.997051883414242659
    var stringValue = result.toString();
    var x = stringValue.substring(0,  stringValue.length-8) + "." + stringValue.substring(stringValue.length-8)
    console.log(x);
  }
  
  getBalance();