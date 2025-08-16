import { gql, QueryHookOptions, useLazyQuery, useQuery } from '@apollo/client';
import { LazyQueryHookOptions } from '@apollo/client/react/types/types';
import { useCallback, useMemo } from 'react';

export interface CoinDto {
  type: string;
  symbol: string;
  balance: string;
  decimals: number;
  isVerified: boolean;
  iconURL: string | null;
  usd: string | null;
  pricePercentChange24h: string | null;
  wrappedChain: string | null;
  bridge: string | null;
}
export type CoinBalance = {
  balance: string;
  decimals: number;
};

const GET_COINS_GQL = gql`
  query getCoins($address: SuiAddress!) {
    address(address: $address) {
      balances {
        nodes {
          coinType {
            repr
          }
          totalBalance
          coinObjectCount
        }
      }
      coins {
        nodes {
          coinBalance
          contents {
            json
            type {
              repr
            }
          }
        }
      }
    }
  }
`;

function formatCoinFromGql(balanceNode: any, coinData?: any): CoinDto {
  const coinType = balanceNode.coinType.repr;
  
  // Extract symbol from coin type (e.g., "0x2::sui::SUI" -> "SUI")
  const symbolMatch = coinType.match(/:([^:]+)$/);
  const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'UNKNOWN';
  
  // For now, we'll use default values for missing metadata
  // In a real implementation, you might want to fetch this from a separate source
  const isVerified = coinType.startsWith('0x2::sui::SUI') || coinType.startsWith('0x2::');
  
  return {
    type: coinType,
    symbol: symbol,
    balance: balanceNode.totalBalance,
    isVerified: isVerified,
    decimals: getDefaultDecimals(coinType),
    iconURL: getDefaultIconURL(coinType),
    usd: null, // Would need additional API call to get USD value
    pricePercentChange24h: null,
    wrappedChain: null,
    bridge: null,
  };
}

function getDefaultDecimals(coinType: string): number {
  // SUI has 9 decimals, most others default to 6
  if (coinType.includes('::sui::SUI')) {
    return 9;
  }
  return 6;
}

function getDefaultIconURL(coinType: string): string | null {
  // Return default icon for SUI, null for others
  if (coinType.includes('::sui::SUI')) {
    return 'https://sui.io/sui-icon.svg'; // You might want to use a local asset
  }
  return null;
}
/**
 * get coins
 * @param address
 * @param options
 */
export default function useCoins(address: string, options?: QueryHookOptions) {
  const { pollInterval = 5 * 1000, ...restOptions } = options || {};
  const { data, ...rest } = useQuery(GET_COINS_GQL, {
    variables: {
      address,
    },
    pollInterval,
    skip: !address,
    ...restOptions,
  });
  
  const formattedData = useMemo(() => {
    if (!data?.address?.balances?.nodes) {
      return [];
    }
    
    return data.address.balances.nodes
      .filter((balanceNode: any) => balanceNode.totalBalance !== '0')
      .map((balanceNode: any) => formatCoinFromGql(balanceNode));
  }, [data]);

  // reference by coin type
  const coinMap = useMemo(() => {
    const map: Map<string, CoinDto> = new Map();
    formattedData.forEach((coin) => {
      map.set(coin.type, coin);
    });
    return map;
  }, [formattedData]);

  const getCoinBalance = useCallback(
    (coinType: string): CoinBalance => {
      const coin = coinMap.get(coinType);
      // NOTE: why return an object instead of number or bigint? compatible for different usages
      // 1. For display, bigint would omit the fraction part, not accurate
      // 2. For calculation, balance could be huge, might exceed the max safe integer
      return {
        balance: coin?.balance ?? '0',
        decimals: coin?.decimals ?? 0,
      };
    },
    [formattedData]
  );

  return {
    data: formattedData,
    getCoinBalance,
    ...rest,
  };
}

export function useCoinsLazyQuery(options?: LazyQueryHookOptions) {
  const [getCoins, { data, ...rest }] = useLazyQuery(
    GET_COINS_GQL,
    options
  );
  
  const formattedData = useMemo(() => {
    if (!data?.address?.balances?.nodes) {
      return [];
    }
    
    return data.address.balances.nodes
      .filter((balanceNode: any) => balanceNode.totalBalance !== '0')
      .map((balanceNode: any) => formatCoinFromGql(balanceNode));
  }, [data]);
  
  return [
    getCoins,
    {
      data: formattedData,
      ...rest,
    },
  ] as const;
}

export { useCoins };
