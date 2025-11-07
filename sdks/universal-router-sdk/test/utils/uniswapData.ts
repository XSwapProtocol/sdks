import JSBI from 'jsbi'
import { ethers } from 'ethers'
import { MixedRouteTrade, MixedRouteSDK, Trade as RouterTrade } from '@x-swap-protocol/router-sdk'
import { Trade as V2Trade, Pair, Route as RouteV2, computePairAddress } from '@x-swap-protocol/v2-sdk'
import {
  Trade as V3Trade,
  Pool,
  Route as RouteV3,
  nearestUsableTick,
  TickMath,
  TICK_SPACINGS,
  FeeAmount,
} from '@x-swap-protocol/v3-sdk'
import { SwapOptions } from '../../src'
import { CurrencyAmount, TradeType, Ether, Token, Percent, Currency } from '@x-swap-protocol/sdk-core'
import IUniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import { TEST_RECIPIENT_ADDRESS } from './addresses'

const V2_FACTORY = '0x347D14b13a68457186b2450bb2a6c2Fd7B38352f'
const V2_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: 'reserve0',
        type: 'uint112',
      },
      {
        internalType: 'uint112',
        name: 'reserve1',
        type: 'uint112',
      },
      {
        internalType: 'uint32',
        name: 'blockTimestampLast',
        type: 'uint32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const FORK_BLOCK = 16075500

export const XDC = Ether.onChain(50)
export const WXDC = new Token(50, '0x951857744785E80e2De051c32EE7b25f9c458C42', 18, 'WXDC', 'Wrapped XDC')
export const xUSDT = new Token(50, '0xD4B5f10D61916Bd6E0860144a91Ac658dE8a1437', 6, 'xUSDT', 'Bridget USDT')
export const USDC = new Token(50, '0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1', 6, 'USDC', 'USDC')
export const XSP = new Token(50, '0x36726235dAdbdb4658D33E62a249dCA7c4B2bC68', 18, 'XSP', 'XSP Token')
export const CGO = new Token(50, '0x8f9920283470F52128bF11B0c14E798bE704fD15', 18, 'CGO', 'Comtech Gold')
export const FEE_MEDIUM = FeeAmount.MEDIUM

type UniswapPools = {
  WXDC_xUSDT_V2: Pair
  XSP_WXDC_V2: Pair
  WXDC_USDC_V3: Pool
  WXDC_USDC_V3_LOW_FEE: Pool
  USDC_CGO_V3: Pool
}

export async function getXSwapPools(forkBlock?: number): Promise<UniswapPools> {
  const fork = forkBlock ?? FORK_BLOCK

  const WXDC_xUSDT_V2 = await getPair(WXDC, xUSDT, fork)
    const XSP_WXDC_V2 = await getPair(XSP, WXDC, fork)

  const WXDC_USDC_V3 = await getPool(WXDC, USDC, FEE_MEDIUM, fork)
  const WXDC_USDC_V3_LOW_FEE = await getPool(WXDC, USDC, FeeAmount.LOW, fork)
  const USDC_CGO_V3 = await getPool(USDC, CGO, FeeAmount.LOW, fork)

  return {
    WXDC_xUSDT_V2,
    XSP_WXDC_V2,
    WXDC_USDC_V3,
    WXDC_USDC_V3_LOW_FEE,
    USDC_CGO_V3,
  }
}

function getProvider(): ethers.providers.BaseProvider {
  return new ethers.providers.JsonRpcProvider(process.env['FORK_URL'])
}

export async function getPair(tokenA: Token, tokenB: Token, blockNumber: number): Promise<Pair> {
  const pairAddress = computePairAddress({ factoryAddress: V2_FACTORY, tokenA, tokenB })
  const contract = new ethers.Contract(pairAddress, V2_ABI, getProvider())
  const { reserve0, reserve1 } = await contract.getReserves({ blockTag: blockNumber })
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  return new Pair(CurrencyAmount.fromRawAmount(token0, reserve0), CurrencyAmount.fromRawAmount(token1, reserve1))
}

export async function getPool(tokenA: Token, tokenB: Token, feeAmount: FeeAmount, blockNumber: number): Promise<Pool> {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  const poolAddress = Pool.getAddress(token0, token1, feeAmount)
  const contract = new ethers.Contract(poolAddress, IUniswapV3Pool.abi, getProvider())
  let liquidity = await contract.liquidity({ blockTag: blockNumber })
  let { sqrtPriceX96, tick } = await contract.slot0({ blockTag: blockNumber })
  liquidity = JSBI.BigInt(liquidity.toString())
  sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString())

  return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
    {
      index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: liquidity,
      liquidityGross: liquidity,
    },
    {
      index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt('-1')),
      liquidityGross: liquidity,
    },
  ])
}

// use some sane defaults
export function swapOptions(options: Partial<SwapOptions>): SwapOptions {
  // If theres a fee this counts as "slippage" for the amount out, so take it into account
  let slippageTolerance = new Percent(5, 100)
  if (!!options.fee) slippageTolerance = slippageTolerance.add(options.fee.fee)
  return Object.assign(
    {
      slippageTolerance,
      recipient: TEST_RECIPIENT_ADDRESS,
    },
    options
  )
}

// alternative constructor to create from protocol-specific sdks
export function buildTrade(
  trades: (
    | V2Trade<Currency, Currency, TradeType>
    | V3Trade<Currency, Currency, TradeType>
    | MixedRouteTrade<Currency, Currency, TradeType>
  )[]
): RouterTrade<Currency, Currency, TradeType> {
  return new RouterTrade({
    v2Routes: trades
      .filter((trade) => trade instanceof V2Trade)
      .map((trade) => ({
        routev2: trade.route as RouteV2<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    v3Routes: trades
      .filter((trade) => trade instanceof V3Trade)
      .map((trade) => ({
        routev3: trade.route as RouteV3<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    mixedRoutes: trades
      .filter((trade) => trade instanceof MixedRouteTrade)
      .map((trade) => ({
        mixedRoute: trade.route as MixedRouteSDK<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    tradeType: trades[0].tradeType,
  })
}
