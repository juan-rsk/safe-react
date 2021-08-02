import semverSatisfies from 'semver/functions/satisfies'
import {
  getSafeSingletonDeployment as getSafeSingletonDeploymentOriginal,
  getSafeL2SingletonDeployment,
  getProxyFactoryDeployment as getProxyFactoryDeploymentOriginal,
  getFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  DeploymentFilter,
  SingletonDeployment,
} from '@gnosis.pm/safe-deployments'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import { LATEST_SAFE_VERSION } from 'src/utils/constants'
import { ETHEREUM_NETWORK } from 'src/config/networks/network.d'
import { ZERO_ADDRESS } from 'src/logic/wallets/ethAddresses'
import { calculateGasOf, EMPTY_DATA } from 'src/logic/wallets/ethTransactions'
import { getWeb3, getNetworkIdFrom } from 'src/logic/wallets/getWeb3'
import { GnosisSafe } from 'src/types/contracts/GnosisSafe.d'
import { GnosisSafeProxyFactory } from 'src/types/contracts/GnosisSafeProxyFactory.d'
import { FallbackManager } from 'src/types/contracts/FallbackManager.d'
import { MultiSend } from 'src/types/contracts/MultiSend.d'
import { getSafeInfo, SafeInfo } from 'src/logic/safe/utils/safeInformation'

export const SENTINEL_ADDRESS = '0x0000000000000000000000000000000000000001'

let proxyFactoryMaster: GnosisSafeProxyFactory
let safeMaster: GnosisSafe
let fallbackHandler: FallbackManager
let multiSend: MultiSend

const RSK_MAINNET_CHAIN_ID = '30'
const RSK_TESTNET_CHAIN_ID = '31'
const RSK_CHAIN_IDS = [RSK_MAINNET_CHAIN_ID, RSK_TESTNET_CHAIN_ID]

const safeSingletonRSKDeployments = [
  {
    defaultAddress: '0xffd41b816f2821e579b4da85c7352bf4f17e4fa5',
    released: true,
    contractName: 'GnosisSafe',
    version: '1.2.0',
    networkAddresses: {
      // Mainnet
      '30': '0xc6cfa90ff601d6aac45d8dcf194cf38b91aca368',
      // Testnet
      '31': '0xffd41b816f2821e579b4da85c7352bf4f17e4fa5',
    },
    abi: [
      {
        inputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'AddedOwner',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes32',
            name: 'approvedHash',
            type: 'bytes32',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'ApproveHash',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'address',
            name: 'masterCopy',
            type: 'address',
          },
        ],
        name: 'ChangedMasterCopy',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'uint256',
            name: 'threshold',
            type: 'uint256',
          },
        ],
        name: 'ChangedThreshold',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'contract Module',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'DisabledModule',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'contract Module',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'EnabledModule',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'bytes32',
            name: 'txHash',
            type: 'bytes32',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'payment',
            type: 'uint256',
          },
        ],
        name: 'ExecutionFailure',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'ExecutionFromModuleFailure',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'ExecutionFromModuleSuccess',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'bytes32',
            name: 'txHash',
            type: 'bytes32',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'payment',
            type: 'uint256',
          },
        ],
        name: 'ExecutionSuccess',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'RemovedOwner',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes32',
            name: 'msgHash',
            type: 'bytes32',
          },
        ],
        name: 'SignMsg',
        type: 'event',
      },
      {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
      },
      {
        constant: true,
        inputs: [],
        name: 'NAME',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'VERSION',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256',
          },
        ],
        name: 'addOwnerWithThreshold',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        name: 'approvedHashes',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: '_masterCopy',
            type: 'address',
          },
        ],
        name: 'changeMasterCopy',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256',
          },
        ],
        name: 'changeThreshold',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'contract Module',
            name: 'prevModule',
            type: 'address',
          },
          {
            internalType: 'contract Module',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'disableModule',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'domainSeparator',
        outputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'contract Module',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'enableModule',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
        ],
        name: 'execTransactionFromModule',
        outputs: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
        ],
        name: 'execTransactionFromModuleReturnData',
        outputs: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool',
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getModules',
        outputs: [
          {
            internalType: 'address[]',
            name: '',
            type: 'address[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: 'start',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'pageSize',
            type: 'uint256',
          },
        ],
        name: 'getModulesPaginated',
        outputs: [
          {
            internalType: 'address[]',
            name: 'array',
            type: 'address[]',
          },
          {
            internalType: 'address',
            name: 'next',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getOwners',
        outputs: [
          {
            internalType: 'address[]',
            name: '',
            type: 'address[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getThreshold',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'contract Module',
            name: 'module',
            type: 'address',
          },
        ],
        name: 'isModuleEnabled',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'isOwner',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'nonce',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'prevOwner',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256',
          },
        ],
        name: 'removeOwner',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'handler',
            type: 'address',
          },
        ],
        name: 'setFallbackHandler',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        name: 'signedMessages',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'prevOwner',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'oldOwner',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'swapOwner',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address[]',
            name: '_owners',
            type: 'address[]',
          },
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'fallbackHandler',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'paymentToken',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'payment',
            type: 'uint256',
          },
          {
            internalType: 'address payable',
            name: 'paymentReceiver',
            type: 'address',
          },
        ],
        name: 'setup',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'safeTxGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'baseGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'gasPrice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'gasToken',
            type: 'address',
          },
          {
            internalType: 'address payable',
            name: 'refundReceiver',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'signatures',
            type: 'bytes',
          },
        ],
        name: 'execTransaction',
        outputs: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool',
          },
        ],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
        ],
        name: 'requiredTxGas',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'bytes32',
            name: 'hashToApprove',
            type: 'bytes32',
          },
        ],
        name: 'approveHash',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'bytes',
            name: '_data',
            type: 'bytes',
          },
        ],
        name: 'signMessage',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'bytes',
            name: '_data',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: '_signature',
            type: 'bytes',
          },
        ],
        name: 'isValidSignature',
        outputs: [
          {
            internalType: 'bytes4',
            name: '',
            type: 'bytes4',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'bytes',
            name: 'message',
            type: 'bytes',
          },
        ],
        name: 'getMessageHash',
        outputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'safeTxGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'baseGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'gasPrice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'gasToken',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'refundReceiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_nonce',
            type: 'uint256',
          },
        ],
        name: 'encodeTransactionData',
        outputs: [
          {
            internalType: 'bytes',
            name: '',
            type: 'bytes',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'enum Enum.Operation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'safeTxGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'baseGas',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'gasPrice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'gasToken',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'refundReceiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_nonce',
            type: 'uint256',
          },
        ],
        name: 'getTransactionHash',
        outputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
  },
]

const proxyRSKDeployments = [
  {
    defaultAddress: '0x5b836117aed4ca4dee8e2e464f97f7f59b426c5a',
    released: true,
    contractName: 'ProxyFactory',
    version: '1.2.0',
    networkAddresses: {
      // Mainnet
      '30': '0x4b1af52ea200baebf79450dbc996573a7b75f65a',
      // Testnet
      '31': '0x5b836117aed4ca4dee8e2e464f97f7f59b426c5a',
    },
    abi: [
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'contract GnosisSafeProxy',
            name: 'proxy',
            type: 'address',
          },
        ],
        name: 'ProxyCreation',
        type: 'event',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'masterCopy',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'createProxy',
        outputs: [
          {
            internalType: 'contract GnosisSafeProxy',
            name: 'proxy',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'proxyRuntimeCode',
        outputs: [
          {
            internalType: 'bytes',
            name: '',
            type: 'bytes',
          },
        ],
        payable: false,
        stateMutability: 'pure',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'proxyCreationCode',
        outputs: [
          {
            internalType: 'bytes',
            name: '',
            type: 'bytes',
          },
        ],
        payable: false,
        stateMutability: 'pure',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: '_mastercopy',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'initializer',
            type: 'bytes',
          },
          {
            internalType: 'uint256',
            name: 'saltNonce',
            type: 'uint256',
          },
        ],
        name: 'createProxyWithNonce',
        outputs: [
          {
            internalType: 'contract GnosisSafeProxy',
            name: 'proxy',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: '_mastercopy',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'initializer',
            type: 'bytes',
          },
          {
            internalType: 'uint256',
            name: 'saltNonce',
            type: 'uint256',
          },
          {
            internalType: 'contract IProxyCreationCallback',
            name: 'callback',
            type: 'address',
          },
        ],
        name: 'createProxyWithCallback',
        outputs: [
          {
            internalType: 'contract GnosisSafeProxy',
            name: 'proxy',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: '_mastercopy',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'initializer',
            type: 'bytes',
          },
          {
            internalType: 'uint256',
            name: 'saltNonce',
            type: 'uint256',
          },
        ],
        name: 'calculateCreateProxyWithNonceAddress',
        outputs: [
          {
            internalType: 'contract GnosisSafeProxy',
            name: 'proxy',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
  },
]

const getSafeSingletonDeploymentFromRSK = (filter?: DeploymentFilter | undefined): SingletonDeployment | undefined => {
  // if ( filter?.network) {
  //   return safeSingletonRSKDeployment[filter?.network]
  // }
  // return undefined
  return safeSingletonRSKDeployments[0]
}

const getProxyDeploymentFromRSK = (filter?: DeploymentFilter | undefined): SingletonDeployment | undefined => {
  // if ( filter?.network) {
  //   return proxyRSKDeployment[filter?.network]
  // }
  // return undefined
  return proxyRSKDeployments[0]
}

const getSafeSingletonDeployment = (filter?: DeploymentFilter | undefined) => {
  if (filter?.network && RSK_CHAIN_IDS.includes(filter?.network)) {
    return getSafeSingletonDeploymentFromRSK(filter)
  }
  return getSafeSingletonDeploymentOriginal(filter)
}

const getSafeContractDeployment = ({
  networkId,
  safeVersion,
}: {
  networkId?: ETHEREUM_NETWORK
  safeVersion: string
}) => {
  // If version is 1.3.0 we can use instance compatible with L2 for all networks
  const useL2ContractVersion = semverSatisfies(safeVersion, '>=1.3.0')
  const getDeployment = useL2ContractVersion ? getSafeL2SingletonDeployment : getSafeSingletonDeployment
  return (
    getDeployment({
      version: safeVersion,
      network: networkId?.toString(),
    }) ||
    getDeployment({
      version: safeVersion,
    })
  )
}

const getProxyFactoryDeployment = (filter?: DeploymentFilter | undefined) => {
  if (filter?.network && RSK_CHAIN_IDS.includes(filter?.network)) {
    return getProxyDeploymentFromRSK(filter)
  }
  return getProxyFactoryDeploymentOriginal(filter)
}

/**
 * Creates a Contract instance of the GnosisSafe contract
 * @param {Web3} web3
 * @param {ETHEREUM_NETWORK} networkId
 */
const getGnosisSafeContractInstance = (web3: Web3, networkId: ETHEREUM_NETWORK): GnosisSafe => {
  const safeSingletonDeployment = getSafeContractDeployment({ networkId, safeVersion: LATEST_SAFE_VERSION })

  const contractAddress =
    safeSingletonDeployment?.networkAddresses[networkId] ?? safeSingletonDeployment?.defaultAddress
  return new web3.eth.Contract(safeSingletonDeployment?.abi as AbiItem[], contractAddress) as unknown as GnosisSafe
}

/**
 * Creates a Contract instance of the GnosisSafeProxyFactory contract
 * @param {Web3} web3
 * @param {ETHEREUM_NETWORK} networkId
 */
const getProxyFactoryContractInstance = (web3: Web3, networkId: ETHEREUM_NETWORK): GnosisSafeProxyFactory => {
  const proxyFactoryDeployment =
    getProxyFactoryDeployment({
      version: LATEST_SAFE_VERSION,
      network: networkId.toString(),
    }) ||
    getProxyFactoryDeployment({
      version: LATEST_SAFE_VERSION,
    })

  const contractAddress = proxyFactoryDeployment?.networkAddresses[networkId] ?? proxyFactoryDeployment?.defaultAddress
  return new web3.eth.Contract(
    proxyFactoryDeployment?.abi as AbiItem[],
    contractAddress,
  ) as unknown as GnosisSafeProxyFactory
}

/**
 * Creates a Contract instance of the FallbackHandler contract
 * @param {Web3} web3
 * @param {ETHEREUM_NETWORK} networkId
 */
const getFallbackHandlerContractInstance = (web3: Web3, networkId: ETHEREUM_NETWORK): FallbackManager => {
  const fallbackHandlerDeployment =
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
      network: networkId.toString(),
    }) ||
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
    })

  const contractAddress =
    fallbackHandlerDeployment?.networkAddresses[networkId] ?? fallbackHandlerDeployment?.defaultAddress
  return new web3.eth.Contract(
    fallbackHandlerDeployment?.abi as AbiItem[],
    contractAddress,
  ) as unknown as FallbackManager
}

/**
 * Creates a Contract instance of the MultiSend contract
 * @param {Web3} web3
 * @param {ETHEREUM_NETWORK} networkId
 */
const getMultiSendContractInstance = (web3: Web3, networkId: ETHEREUM_NETWORK): MultiSend => {
  const multiSendDeployment =
    getMultiSendCallOnlyDeployment({
      network: networkId.toString(),
    }) || getMultiSendCallOnlyDeployment()

  const contractAddress = multiSendDeployment?.networkAddresses[networkId] ?? multiSendDeployment?.defaultAddress
  return new web3.eth.Contract(multiSendDeployment?.abi as AbiItem[], contractAddress) as unknown as MultiSend
}

export const getMasterCopyAddressFromProxyAddress = async (proxyAddress: string): Promise<string | undefined> => {
  let masterCopyAddress: string | undefined
  try {
    const res = await getSafeInfo(proxyAddress)
    masterCopyAddress = (res as SafeInfo)?.implementation.value
    if (!masterCopyAddress) {
      console.error(`There was not possible to get masterCopy address from proxy ${proxyAddress}.`)
    }
  } catch (e) {
    e.log()
  }
  return masterCopyAddress
}

export const instantiateSafeContracts = async () => {
  const web3 = getWeb3()
  const networkId = await getNetworkIdFrom(web3)

  // Create ProxyFactory Master Copy
  proxyFactoryMaster = getProxyFactoryContractInstance(web3, networkId)

  // Create Safe Master copy
  safeMaster = getGnosisSafeContractInstance(web3, networkId)

  // Create Fallback Handler
  fallbackHandler = getFallbackHandlerContractInstance(web3, networkId)

  // Create MultiSend contract
  multiSend = getMultiSendContractInstance(web3, networkId)
}

export const getSafeMasterContract = async () => {
  await instantiateSafeContracts()
  return safeMaster
}

export const getSafeMasterContractAddress = () => {
  return safeMaster.options.address
}

export const getFallbackHandlerContractAddress = () => {
  return fallbackHandler.options.address
}

export const getMultisendContract = () => {
  return multiSend
}

export const getMultisendContractAddress = () => {
  return multiSend.options.address
}

export const getSafeDeploymentTransaction = (
  safeAccounts: string[],
  numConfirmations: number,
  safeCreationSalt: number,
) => {
  const gnosisSafeData = safeMaster.methods
    .setup(
      safeAccounts,
      numConfirmations,
      ZERO_ADDRESS,
      EMPTY_DATA,
      fallbackHandler.options.address,
      ZERO_ADDRESS,
      0,
      ZERO_ADDRESS,
    )
    .encodeABI()
  return proxyFactoryMaster.methods.createProxyWithNonce(safeMaster.options.address, gnosisSafeData, safeCreationSalt)
}

export const estimateGasForDeployingSafe = async (
  safeAccounts: string[],
  numConfirmations: number,
  userAccount: string,
  safeCreationSalt: number,
) => {
  const proxyFactoryData = getSafeDeploymentTransaction(safeAccounts, numConfirmations, safeCreationSalt).encodeABI()

  return calculateGasOf({
    data: proxyFactoryData,
    from: userAccount,
    to: proxyFactoryMaster.options.address,
  }).then((value) => value * 2)
}

export const getGnosisSafeInstanceAt = (safeAddress: string, safeVersion: string): GnosisSafe => {
  const safeSingletonDeployment = getSafeContractDeployment({ safeVersion })

  const web3 = getWeb3()
  return new web3.eth.Contract(safeSingletonDeployment?.abi as AbiItem[], safeAddress) as unknown as GnosisSafe
}
