import { BigNumber } from '@ethersproject/bignumber'

// @deprecated please use permit2Address(chainId: number)
export const PERMIT2_ADDRESS = '0x941acf4e2df51bf43c3c4167631dbefa268bc9d7'

export function permit2Address(chainId?: number): string {
  switch (chainId) {
    case 51:
      return '0x4b722f4a38f97e4078260de0c47f34ae0c404dbf'
    default:
      return PERMIT2_ADDRESS
  }
}

export const MaxUint48 = BigNumber.from('0xffffffffffff')
export const MaxUint160 = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffff')
export const MaxUint256 = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

// alias max types for their usages
// allowance transfer types
export const MaxAllowanceTransferAmount = MaxUint160
export const MaxAllowanceExpiration = MaxUint48
export const MaxOrderedNonce = MaxUint48

// signature transfer types
export const MaxSignatureTransferAmount = MaxUint256
export const MaxUnorderedNonce = MaxUint256
export const MaxSigDeadline = MaxUint256

export const InstantExpiration: BigNumber = BigNumber.from(0)
