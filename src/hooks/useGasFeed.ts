'use client'

import { useEffect } from 'react'
import { WebSocketProvider, formatUnits } from 'ethers'
import { useGasStore } from '@/store/useGasStore'

// Replace with your actual WebSocket RPCs
const ETHEREUM_WS = 'wss://mainnet.infura.io/ws/v3/64c5c4fd9487432bb6be33ae45fe6300'
const POLYGON_WS = 'wss://polygon-mainnet.infura.io/ws/v3/93727e51c27c4f0a96a80507f2bed9c1'
const ARBITRUM_WS = 'wss://arb-mainnet.g.alchemy.com/v2/GoWn1sSDa01QBMXTXnjlL'

const CHAINS = [
  {
    name: 'ethereum' as const,
    ws: ETHEREUM_WS,
  },
  {
    name: 'polygon' as const,
    ws: POLYGON_WS,
  },
  {
    name: 'arbitrum' as const,
    ws: ARBITRUM_WS,
  },
]

export const useGasFeed = () => {
  const updateChainData = useGasStore.getState().updateChainData

  useEffect(() => {
    const providers: Record<string, WebSocketProvider> = {}

    CHAINS.forEach(({ name, ws }) => {
      const provider = new WebSocketProvider(ws)
      providers[name] = provider

      provider.on('block', async (blockNumber: number) => {
        try {
          const block = await provider.getBlock(blockNumber)
          if (!block || !block.baseFeePerGas) return

          const baseFee = parseFloat(formatUnits(block.baseFeePerGas, 'gwei'))
          const priorityHex = await provider.send('eth_maxPriorityFeePerGas', [])
          const priorityFee = parseFloat(formatUnits(priorityHex, 'gwei'))

          updateChainData(name, { baseFee, priorityFee })
        } catch (err) {
          console.error(`Error fetching ${name} gas:`, err)
        }
      })
    })

    return () => {
      Object.values(providers).forEach((provider) => provider.destroy())
    }
  }, [])
}
