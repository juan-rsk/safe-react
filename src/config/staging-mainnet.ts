// 
import stagingConfig from './staging'
import { TX_SERVICE_HOST, RELAY_API_URL } from 'src/config/names'

const stagingMainnetConfig = {
  ...stagingConfig,
  [TX_SERVICE_HOST]: 'https://api.rsk-safe.com/api/v1/',
  [RELAY_API_URL]: 'https://safe-relay.mainnet.staging.gnosisdev.com/api/v1/',
}

export default stagingMainnetConfig
