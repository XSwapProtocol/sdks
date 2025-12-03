import { ChainId, WETH9 } from '@x-swap-protocol/sdk-core'
import { BigNumber } from 'ethers'

type ChainConfig = {
  permit2: string
  router: string
  beta: string
  creationBlock: number
  weth: string
}

const WETH_NOT_SUPPORTED_ON_CHAIN = '0x0000000000000000000000000000000000000000'

const CHAIN_CONFIGS: { [key in ChainId]: ChainConfig } = {
  // mainnet
  [ChainId.XDC]: {
    permit2: '0x941acf4e2df51bf43c3c4167631dbefa268bc9d7',
    router: '0xe1bcb1c502a545ee85a1881b95cdd46d394d2b2e',
    beta: '0x4A4dE54bF3A539dDe03220F54601a4213b66d14d',
    weth: WETH9[ChainId.XDC].address,
    creationBlock: 59782467,
  },
  [ChainId.APOTHEM]: {
    permit2: '0x4b722f4a38f97e4078260de0c47f34ae0c404dbf',
    router: '0xef53145eaa955f0b7749a80315de815e383540fb',
    beta: '',
    weth: WETH9[ChainId.APOTHEM].address,
    creationBlock: 48412660,
  },
}

export const UNIVERSAL_ROUTER_ADDRESS = (chainId: number, isBeta?: boolean): string => {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error(`Universal Router not deployed on chain ${chainId}`)
  return isBeta ? CHAIN_CONFIGS[chainId as ChainId].beta : CHAIN_CONFIGS[chainId as ChainId].router
}

export const UNIVERSAL_ROUTER_CREATION_BLOCK = (chainId: number): number => {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error(`Universal Router not deployed on chain ${chainId}`)
  return CHAIN_CONFIGS[chainId as ChainId].creationBlock
}

export const WETH_ADDRESS = (chainId: number): string => {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error(`Wrapped Token not deployed on chain ${chainId}`)

  if (CHAIN_CONFIGS[chainId as ChainId].weth == WETH_NOT_SUPPORTED_ON_CHAIN)
    throw new Error(`Chain ${chainId} does not have WETH`)

  return CHAIN_CONFIGS[chainId as ChainId].weth
}

export const PERMIT2_ADDRESSES = (chainId: number): string => {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error(`Permit not deployed on chain ${chainId}`)

  return CHAIN_CONFIGS[chainId as ChainId].permit2
}

export const CONTRACT_BALANCE = BigNumber.from(2).pow(255)
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
export const E_ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1)
export const MAX_UINT160 = BigNumber.from(2).pow(160).sub(1)

export const SENDER_AS_RECIPIENT = '0x0000000000000000000000000000000000000001'
export const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002'

export const OPENSEA_CONDUIT_SPENDER_ID = 0
export const SUDOSWAP_SPENDER_ID = 1
