require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    defaultNetwork: "sepolia",
    networks: {
      hardhat:{},
      sepolia: {
        url: "https://rpc.ankr.com/eth_sepolia/df10d2f135adfb00463884c21269cb6771abcf42721212dff42445596f191aa6",
        accounts: [`0x${process.env.PRIVATE_KEY}`]
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

