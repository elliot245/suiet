import { useQuery } from '@apollo/client';
import { formatCurrency } from '@suiet/core';
import classnames from 'classnames';
import QRCodeSVG from 'qrcode.react';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import Address from '../../../components/Address';
import { LoadingSpokes } from '../../../components/Loading';
import message from '../../../components/message';
import { Modal } from '../../../components/modals';
import Typo from '../../../components/Typo';
import WaterDropIcon from '../../../components/WaterDropIcon';
import useCoins from '../../../hooks/coin/useCoins';
import { useFeatureFlagsWithNetwork } from '../../../hooks/useFeatureFlags';
import { useNetwork } from '../../../hooks/useNetwork';
import { GET_SUPPORT_SWAP_COINS } from '../../../utils/graphql/query';
import Banner from '../Banner';
import styles from './index.module.scss';
export type ReceiveButtonProps = {
  address: string;
};

const ReceiveButton = (props: ReceiveButtonProps) => {
  return (
    <Modal
      title={
        <div className={'flex items-center'}>
          <span>Receive</span>
          <WaterDropIcon size={'small'} className={'ml-[8px]'} />
        </div>
      }
      trigger={
        <div
          className={classnames(
            styles['operations-item'],
            styles['receive'],
            'ml-[6px]'
          )}
        >
          {/* <img src={IconQrCode} className={styles['icon']} /> */}
          <span>Receive</span>
        </div>
      }
      contentProps={{
        onOpenAutoFocus: (e) => {
          e.preventDefault(); // prevent autofocus on the close btn
        },
      }}
    >
      <div className={'flex flex-col items-center mt-[22px]'}>
        <div className={'flex flex-col items-center'}>
          <QRCodeSVG value={props.address} className={styles['qr-code']} />
          <Typo.Normal className={classnames('mt-[2px]', styles['text-scan'])}>
            scan to receive
          </Typo.Normal>
        </div>
        <Address value={props.address} className={'mt-[21px]'} />
      </div>
    </Modal>
  );
};

export type DashboardProps = {
  address: string;
  networkId: string;
};

function MainPage({ address, networkId }: DashboardProps) {
  // const {
  //   data: suiBalance,
  //   loading: isBalanceLoading,
  //   error: balanceError,
  // } = useSuiBalance(address);
  const {
    data: coins,
    loading: isLoading,
    error: coinsError,
  } = useCoins(address);
  const t = new Date();
  const [airdropTime, setAirdropTime] = useState(t.setTime(t.getTime() - 5000));
  const [airdropLoading, setAirdropLoading] = useState(false);
  const featureFlags = useFeatureFlagsWithNetwork();
  const { data: networkConfig } = useNetwork(networkId);
  const faucetApi =
    featureFlags?.faucet_api ?? 
    networkConfig?.faucet_api ??
    `https://faucet.${networkId}.sui.io/gas`;

  // preload swap data
  useQuery(GET_SUPPORT_SWAP_COINS, {
    fetchPolicy: 'cache-and-network',
    variables: {
      ownerAddress: address,
    },
    skip: !address,
  });
  const usd = coins
    .map((coin) => {
      return Number(coin.usd);
    })
    .reduce((total, value) => total + value, 0);
  useEffect(() => {
    if (!coinsError) return;
    message.error('Fetch balance failed: ' + coinsError.message);
  }, [coinsError]);

  return (
    <div className={styles['main-content']}>
      <Banner />
      <div className={styles['balance']}>
        {isLoading || coinsError ? (
          <Skeleton width={'140px'} height={'36px'} />
        ) : (
          <span>${formatCurrency(usd, { decimals: 0 })}</span>
        )}
      </div>
      <Address value={address} className={styles['address']} />
      <div className={styles['operations']}>
        {featureFlags?.enable_buy_crypto && (
          <a
            className={classnames(styles['operations-item'])}
            target={'_blank'}
            rel={'noreferrer'}
            href={`https://pay.suiet.app/?wallet_address=${address}`}
          >
            Buy
          </a>
        )}
        {networkId !== 'mainnet' && (
          <div
            className={classnames(
              styles['operations-item'],
              styles['airdrop'],
              {
                [styles['operations-item-loading']]: airdropLoading,
              }
            )}
            onClick={() => {
              const d = new Date();
              if (!airdropLoading) {
                if (d.getTime() - airdropTime <= 5000) {
                  message.error('Please wait 5 seconds');
                } else {
                  const options = {
                    method: 'POST',
                    headers: {
                      'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      FixedAmountRequest: {
                        recipient: address,
                      },
                    }),
                  };
                  setAirdropLoading(true);
                  fetch(faucetApi, options)
                    .then(async (response) => {
                      if (response.ok) {
                        message.success('Faucet succeeded');
                        return await response.json();
                      } else {
                        const text = await response.text();
                        try {
                          const json = JSON.parse(text);
                          message.error(json.error);
                        } catch (e) {
                          if (text.includes('rate limited')) {
                            message.error(
                              'You have been rate limited, please try again 6 hours later'
                            );
                          } else {
                            message.error(
                              'Sui network is not available, please try again in a few hours'
                            );
                          }
                        }
                      }
                    })
                    .catch((err) => {
                      console.log('error:', err);
                      message.error(err.message);
                    })
                    .finally(() => {
                      // TODO: global refetch for coin
                      // setTimeout(() => {
                      //   mutate(swrKeyWithNetwork(swrKeyForUseCoins, network));
                      // }, 1000);
                      setAirdropTime(d.getTime());
                      setAirdropLoading(false);
                    });
                }
              }
            }}
          >
            {airdropLoading ? (
              <div>
                <LoadingSpokes width={'12px'} height={'12px'} />
              </div>
            ) : (
              'Faucet'
            )}
          </div>
        )}
        <ReceiveButton address={address} />

        <Link to={'/send'}>
          <div
            className={classnames(
              styles['operations-item'],
              styles['send'],
              'ml-[6px]'
            )}
          >
            Send
          </div>
        </Link>
      </div>
    </div>
  );
}

export default MainPage;
