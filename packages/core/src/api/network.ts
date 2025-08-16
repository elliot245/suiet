export type Network = {
  id: string;
  name: string;
  queryRpcUrl: string;
  graphqlUrl?: string;
  txRpcUrl: string;
  versionCacheTimoutInSeconds: number;
  moveCallGasBudget?: number;
  stakeGasBudget?: number;
  enableMintExampleNFT?: boolean;
  enableStaking?: boolean;
  enableSwap?: boolean;
  enableBuyCrypto?: boolean;
  faucet_api?: string;
};

export interface INetworkApi {
  getNetworks: (enabledOnly: boolean) => Promise<Network[]>;
  getNetwork: (networkId: string) => Promise<Network | undefined>;
  // addCustomNetwork: (network: Network) => Promise<void>;
}

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
    'local',
    {
      id: 'local',
      name: 'local',
      queryRpcUrl: 'http://localhost:5001',
      txRpcUrl: 'http://localhost:5001',
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

export class NetworkApi implements INetworkApi {
  async getNetworks(enabledOnly: boolean): Promise<Network[]> {
    return Array.from(DEFAULT_NETWORKS.values());
  }

  async getNetwork(networkId: string): Promise<Network | undefined> {
    return DEFAULT_NETWORKS.get(networkId);
  }
}
