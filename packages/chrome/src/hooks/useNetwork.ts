import { Network } from '@suiet/core';
import { useMemo } from 'react';
import { isNonEmptyArray } from '../utils/check';
import { useFeatureFlags } from './useFeatureFlags';

const DEFAULT_NETWORKS = new Map([
  [
    'devnet',
    {
      id: 'devnet',
      name: 'devnet',
      queryRpcUrl: 'https://devnet.suiet.app',
      txRpcUrl: 'https://devnet.suiet.app',
      graphqlUrl: 'https://devnet.suiet.app/query',
      versionCacheTimoutInSeconds: 0,
    },
  ],
  [
    'testnet',
    {
      id: 'testnet',
      name: 'testnet',
      queryRpcUrl: 'https://testnet.suiet.app',
      txRpcUrl: 'https://testnet.suiet.app',
      graphqlUrl: 'https://testnet.suiet.app/query',
      versionCacheTimoutInSeconds: 0,
    },
  ],
  [
    'mainnet',
    {
      id: 'mainnet',
      name: 'mainnet',
      queryRpcUrl: 'https://mainnet.suiet.app',
      txRpcUrl: 'https://mainnet.suiet.app',
      graphqlUrl: 'https://mainnet.suiet.app/query',
      versionCacheTimoutInSeconds: 0,
    },
  ],
  [
    'localnet',
    {
      id: 'localnet',
      name: 'localnet',
      queryRpcUrl: 'http://127.0.0.1:9000',
      txRpcUrl: 'http://127.0.0.1:9000',
      graphqlUrl: 'http://127.0.0.1:9125',
      faucet_api: 'http://127.0.0.1:9123/gas',
      versionCacheTimoutInSeconds: 0,
    },
  ],
]);

function trimUndefinedValue(obj: Record<string, any>) {
  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === undefined) {
      Reflect.deleteProperty(newObj, key);
    }
  });
  return newObj;
}

export function useNetwork(networkId: string) {
  const defaultNetwork =
    DEFAULT_NETWORKS.get(networkId) ??
    (DEFAULT_NETWORKS.get('mainnet') as Network);
  const featureFlags = useFeatureFlags();

  const data: Network | undefined = useMemo(() => {
    // first try featureFlags
    if (
      !featureFlags ||
      typeof featureFlags.networks !== 'object' ||
      !isNonEmptyArray(Object.keys(featureFlags.networks))
    ) {
      return defaultNetwork;
    }
    const currentNetworkConfig = featureFlags.networks[networkId];
    // For localnet, always use the default configuration if not found in feature flags
    if (!currentNetworkConfig?.full_node_url) {
      if (networkId === 'localnet') {
        return defaultNetwork;
      }
      return defaultNetwork;
    }

    const overrideData: Network & {
      enableStaking?: boolean;
      enableSwap?: boolean;
      enableMintExampleNFT?: boolean;
      moveCallGasBudget?: number;
      payCoinGasBudget?: number;
    } = Object.assign(
      defaultNetwork,
      trimUndefinedValue({
        id: networkId,
        name: networkId,
        queryRpcUrl: currentNetworkConfig.full_node_url,
        graphqlUrl: currentNetworkConfig.graphql_url,
        txRpcUrl: currentNetworkConfig.full_node_url,
        grphaqlUrl: currentNetworkConfig.graphql_url,
        versionCacheTimoutInSeconds:
          currentNetworkConfig.version_cache_timout_in_seconds,
        stakeGasBudget: currentNetworkConfig.stake_gas_budget,
        enableStaking: currentNetworkConfig.enable_staking,
        enableSwap: currentNetworkConfig.enable_swap,
        enableBuyCrypto: currentNetworkConfig.enable_buy_crypto,
        enableMintExampleNFT: currentNetworkConfig.enable_mint_example_nft,
        moveCallGasBudget: currentNetworkConfig.move_call_gas_budget,
        payCoinGasBudget: currentNetworkConfig.pay_coin_gas_budget,
      })
    );
    return overrideData;
  }, [featureFlags, networkId]);

  return {
    data,
  };
}
