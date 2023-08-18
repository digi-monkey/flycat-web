import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RelayGroup } from 'core/relay/group';
import { RelayGroupMap } from 'core/relay/group/type';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { useDefaultGroup } from '../../pages/relay-manager/hooks/useDefaultGroup';
import { useGetSwitchRelay } from './hooks/useGetSwitchRelay';
import { Button, Cascader, Divider, Modal, Tooltip, message } from 'antd';
import { useEffect, useState } from 'react';
import { RelayModeSelectMenus } from './type';
import { useLoadSelectedStore } from './hooks/useLoadSelectedStore';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import {
  RelaySwitchAlertMsg,
  SwitchRelays,
  WsConnectStatus,
} from 'core/worker/type';
import {
  getConnectedRelayUrl,
  getDisabledTitle,
  getFooterMenus,
  initModeOptions,
  toConnectStatus,
} from './util';

import styles from './index.module.scss';
import Icon from 'components/Icon';
import { ConnPool } from 'core/api/pool';
import classNames from 'classnames';
import { normalizeWsUrl } from 'utils/common';

export interface RelaySelectorProps {
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
  className?: string;
}

export interface Option {
  value: string;
  label: string;
  children?: Option[];
}

export function RelaySelector({
  wsStatusCallback,
  newConnCallback,
  className,
}: RelaySelectorProps) {
  const { t } = useTranslation();
  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const router = useRouter();
  const defaultGroup = useDefaultGroup();
  const myPublicKey = useReadonlyMyPublicKey();

  const [openAboutRelayMode, setOpenAboutRelayMode] = useState(false);
  const [relayGroupMap, setRelayGroupMap] = useState<RelayGroupMap>(new Map());
  const [selectedValue, setSelectedValue] = useState<string[]>();
  const [switchRelays, setSwitchRelays] = useState<SwitchRelays>();

  const [messageApi, contextHolder] = message.useMessage();

  const messageKey = 'relay-progress';

  const modalData = [
    {
      icon: <Icon type="icon-global-mode" />,
      title: t('relaySelector.modal.global'),
      desc: t('relaySelector.modal.globalDesc'),
    },
    {
      icon: <Icon type="icon-auto-mode" />,
      title: t('relaySelector.modal.auto'),
      desc: t('relaySelector.modal.autoDesc'),
    },
    {
      icon: <Icon type="icon-fastest-mode" />,
      title: t('relaySelector.modal.fastest'),
      desc: t('relaySelector.modal.fastestDesc'),
    },
    {
      icon: <Icon type="icon-rule-mode" />,
      title: t('relaySelector.modal.rule'),
      desc: t('relaySelector.modal.ruleDesc'),
    },
  ];

  const progressCb = (restCount: number) => {
    messageApi.open({
      key: messageKey,
      type: 'loading',
      content: `${restCount} relays left to check..`,
      duration: 0,
    });
  };

  const progressEnd = () => {
    messageApi.open({
      key: messageKey,
      type: 'success',
      content: `done!`,
      duration: 1,
    });
  };

  useLoadSelectedStore(myPublicKey, setSelectedValue);
  useGetSwitchRelay(
    myPublicKey,
    relayGroupMap,
    selectedValue,
    setSwitchRelays,
    progressCb,
    progressEnd,
  );

  // detect if other page switch the relay
  worker?.addRelaySwitchAlert((data: RelaySwitchAlertMsg) => {
    if (worker?._portId === data.triggerByPortId) {
      return;
    }

    if (worker?.relayGroupId === data.id) {
      return;
    }

    const id = data.id;
    if (id === 'auto' || id === 'fastest') {
      setSelectedValue([id]);
    } else {
      setSelectedValue(['global', id]);
    }
  });

  useEffect(() => {
    // new a default group for the forward-compatibility
    const defaultGroupId = 'default';
    const groups = new RelayGroup(myPublicKey);
    if (groups.getGroupById(defaultGroupId) == null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setRelayGroupMap(groups.map);
  }, [defaultGroup]);

  useEffect(() => {
    if (newConnCallback) {
      newConnCallback(newConn);
    }
  }, [newConn]);

  useEffect(() => {
    if (wsStatusCallback) {
      wsStatusCallback(wsConnectStatus);
    }
  }, [wsConnectStatus]);

  useEffect(() => {
    if (switchRelays?.relays) {
      const keys = Array.from(wsConnectStatus.keys());
      for (const key of keys) {
        if (!switchRelays.relays.map(r => normalizeWsUrl(r.url)).includes(normalizeWsUrl(key))) {
          wsConnectStatus.delete(key);
        }
      }
    }
  }, [switchRelays?.relays, wsConnectStatus]);

  useEffect(() => {
    if (switchRelays == null) return;
    if (switchRelays.relays == null || switchRelays?.relays.length === 0)
      return;
    if (worker == null) return;

    console.log('check: ', switchRelays.id, worker.relayGroupId);
    if (worker.relayGroupId !== switchRelays.id) {
      worker.switchRelays(switchRelays);
      worker.pullRelayInfo();
    }
  }, [switchRelays, worker?.relayGroupId]);

  const onChange = (value: string[] | any) => {
    if (!Array.isArray(value)) return;
    if (value[0] === RelayModeSelectMenus.manageRelays) {
      router.push(Paths.relayManager);
      return;
    }
    setSelectedValue(value);
  };

  const displayBenchmark = async () => {
    const currentRelays = switchRelays?.relays;
    if (currentRelays) {
      const pool = new ConnPool();
      pool.addConnections(currentRelays.map(r => r.url));
      const benchmark = await pool.benchmarkConcurrently(progressCb);
      progressEnd();
      Modal.info({
        title: 'current relays benchmark',
        content: (
          <>
            {benchmark.map(b => (
              <li key={b.url} className={styles.benchmarkItem}>
                <span>{b.url}</span>
                <span>
                  {b.isFailed || b.t == null ? (
                    <span className={styles.failed}>failed</span>
                  ) : (
                    <span className={styles.success}>
                      {Math.round(b.t!) + ' ms'}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </>
        ),
      });
    }
  };

  const connectedUrlTooltip = (
    <>
      {getConnectedRelayUrl(wsConnectStatus).length > 0 ? getConnectedRelayUrl(wsConnectStatus).map(url => (
        <li key={url}>{url}</li>
      )) : "No connected relays"}
    </>
  );

  return (
    <div className={classNames(styles.relaySelector, className)}>
      {contextHolder}
      <Cascader
        defaultValue={['global', 'default']}
        className={styles.cascader}
        popupClassName={styles.popup}
        options={[
          getDisabledTitle(),
          ...initModeOptions(relayGroupMap),
          ...getFooterMenus(),
        ]}
        allowClear={false}
        value={selectedValue}
        onChange={onChange}
        displayRender={label => (
          <>
            <span className={styles.relayMode}>{label[0]}</span>
            {label.length > 1 && (
              <Tooltip placement="bottom" title={connectedUrlTooltip}>
                <span className={styles.childrenItem}>
                  {toConnectStatus(label[1], wsConnectStatus)}
                </span>
              </Tooltip>
            )}
          </>
        )}
      />

      <Modal
        title={t('relaySelector.modal.title')}
        wrapClassName={styles.modal}
        footer={null}
        open={openAboutRelayMode}
        onCancel={() => setOpenAboutRelayMode(false)}
        closeIcon={<Icon type="icon-cross" className={styles.modalCoseIcons} />}
      >
        <ul>
          {modalData.map(item => (
            <li key={item.title}>
              {item.icon}
              <div className={styles.content}>
                <h1 className={styles.title}>{item.title}</h1>
                <p className={styles.desc}>{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
          <Button type="primary" onClick={() => setOpenAboutRelayMode(false)}>
            {t('relaySelector.modal.buttonText')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
