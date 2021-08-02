import tRBTCLogo from 'src/config/assets/token_trbtc.svg'
import { EnvironmentSettings, ETHEREUM_NETWORK, FEATURES, NetworkConfig, WALLETS } from 'src/config/networks/network.d'
import { ETHGASSTATION_API_KEY } from 'src/utils/constants'

const baseConfig: EnvironmentSettings = {
  // clientGatewayUrl: 'http://127.0.0.1:8000/v1',
  // txServiceUrl: 'https://safe-transaction.testnet.rifos.org/api/v1',
  clientGatewayUrl: 'http://127.0.0.1:3666/v1',
  txServiceUrl: 'http://127.0.0.1:8000/api/v1',

  safeUrl: 'http://localhost:3000/app',
  // FIXME: To understand if we can use an oracle
  gasPrice: 65164000,
  /*   gasPriceOracle: {
    url: `https://ethgasstation.info/json/ethgasAPI.json?api-key=${ETHGASSTATION_API_KEY}`,
    gasParameter: 'average',
    gweiFactor: '1e8',
  }, */
  rpcServiceUrl: 'https://public-node.testnet.rsk.co',
  // safeAppsRpcServiceUrl: 'https://public-node.testnet.rsk.co',
  safeAppsUrl: 'https://public-node.testnet.rsk.co',
  networkExplorerName: 'Etherscan',
  networkExplorerUrl: 'https://explorer.testnet.rsk.co',
  networkExplorerApiUrl: 'https://explorer.testnet.rsk.co/api',
}

const rskTestnet: NetworkConfig = {
  environment: {
    dev: {
      ...baseConfig,
      safeUrl: 'http://localhost:3000/app',
    },
    staging: {
      ...baseConfig,
      // FIXME: To be changed
      safeUrl: 'https://safe-team-rinkeby.staging.gnosisdev.com/app/',
    },
    production: {
      ...baseConfig,
      // FIXME: To be changed
      clientGatewayUrl: 'https://safe-client.rinkeby.gnosis.io/v1',
      txServiceUrl: 'https://safe-transaction.rinkeby.gnosis.io/api/v1',
    },
  },
  network: {
    // FIXME: To be changed
    id: ETHEREUM_NETWORK.RSK_TESTNET,
    backgroundColor: '#E8673C',
    textColor: '#ffffff',
    label: 'RSK Testnet',
    isTestNet: true,
    nativeCoin: {
      address: '0x0000000000000000000000000000000000000000',
      name: 'test RBTC',
      symbol: 'tRBTC',
      decimals: 18,
      logoUri: tRBTCLogo,
    },
  },
  disabledWallets: [WALLETS.FORTMATIC],
  disabledFeatures: [FEATURES.SAFE_APPS],
}

export default rskTestnet
