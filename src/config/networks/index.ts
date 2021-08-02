import local from './local'
// import mainnet from './mainnet'
// import rinkeby from './rinkeby'
// import xdai from './xdai'
// import energy_web_chain from './energy_web_chain'
// import volta from './volta'
// import polygon from './polygon'
// import bsc from './bsc'
import rskTestnet from './rsk_testnet'

export default {
  local,
  // RSKSMART: We want to show RSK Testnet and RSK Mainnet only
  // mainnet,
  // rinkeby,
  // xdai,
  // energy_web_chain,
  // volta,
  // polygon,
  // bsc,
  rsk_testnet: rskTestnet,
}
