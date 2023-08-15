import { Button, Col, Divider, Row } from 'antd';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { DeviceFrameset } from 'react-device-frameset';

import styles from './index.module.scss';
import InstallButton from './install';
import 'react-device-frameset/styles/marvel-devices.min.css';

export const Landing: React.FC = () => {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <img src="logo512.png" alt="" />
      </div>
      <Row>
        <Col xs={24} sm={12} md={12} lg={12}>
          <div className={styles.instr}>
            <div className={styles.title}>
              Exit <span>Toxic</span> Internet
            </div>
            <div className={styles.description}>
              <p>
                Flycat is a{' '}
                <a href="https://github.com/digi-monkey/flycat-web">
                  open source
                </a>{' '}
                social network built on{' '}
                <a href="https://nostr.how/en/what-is-nostr">Nostr protocol</a>.
              </p>
              <p>
                There is no follower count, like button, private recommendation
                algorithm and all the other bullshit components found in modern
                social networks.{' '}
              </p>
              <p>
                Your identity is just a crypto key pair controlled by yourself.
                Like a Bitcoin address.
              </p>
              <p>
                You can choose which server to connect to and migrate your data
                as you go. You can even run your own server which is only
                accessible by your friends and family.
              </p>
            </div>
            <Divider></Divider>
            <div className={styles.action}>
              <InstallButton />
              <Button
                type="link"
                onClick={() =>
                  window.open('https://github.com/digi-monkey/flycat-web')
                }
              >
                Learn More
              </Button>
              <div className={styles.manualInstall}>
                If the above button won&apos;t work, just tap the share button in
                your browser and select Add to Home Screen on iOS or Install
                on Android.
              </div>
            </div>
          </div>
        </Col>
        <Col xs={0} sm={12} md={12} lg={12}>
          <DeviceFrameset device="iPhone 8" color="silver">
            <img className={styles.img} src="images/landing.png" alt="" />
          </DeviceFrameset>
        </Col>
      </Row>
    </div>
  );
};

export default Landing;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
