import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import styles from './index.module.scss';
import RssFeedIcon from '@mui/icons-material/RssFeed';

interface FeedPopupProps {
  options: { label: string; value: string }[];
}

export const RssPopup: React.FC<FeedPopupProps> = ({ options }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOptionClick = (value: string) => {
    setSelectedValue(value);
    handleClose();
    window.location.href = value;
  };

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        <RssFeedIcon />
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{t('subscribeFeed.rssTitle')}</DialogTitle>
        <DialogContent>
          <List>
            {options.map(option => (
              <ListItem
                key={option.value}
                button
                onClick={() => handleOptionClick(option.value)}
                selected={option.value === selectedValue}
              >
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const AtomPopup: React.FC<FeedPopupProps> = ({ options }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOptionClick = (value: string) => {
    setSelectedValue(value);
    handleClose();
    window.location.href = value;
  };

  return (
    <div>
      <Button variant="contained" color="secondary" onClick={handleOpen}>
        Atom
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{t('subscribeFeed.atomTitle')}</DialogTitle>
        <DialogContent>
          <List>
            {options.map(option => (
              <ListItem
                key={option.value}
                button
                onClick={() => handleOptionClick(option.value)}
                selected={option.value === selectedValue}
              >
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const JsonFeedPopup: React.FC<FeedPopupProps> = ({ options }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOptionClick = (value: string) => {
    setSelectedValue(value);
    handleClose();
    window.location.href = value;
  };

  return (
    <div>
      <Button variant="contained" color="secondary" onClick={handleOpen}>
        Json Feed
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{t('subscribeFeed.jsonTitle')}</DialogTitle>
        <DialogContent>
          <List>
            {options.map(option => (
              <ListItem
                key={option.value}
                button
                onClick={() => handleOptionClick(option.value)}
                selected={option.value === selectedValue}
              >
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export interface SubscribeFeedsProps {
  publicKey: string;
}

const SubscribeFeed: React.FC<SubscribeFeedsProps> = ({ publicKey }) => (
  <div className={styles.btnGroup}>
    <RssPopup
      options={[
        { value: '/api/rss/' + publicKey, label: 'Flycat' },
        //{ value: '/api/rss/' + publicKey, label: 'nostri.land' },
      ]}
    />
    <JsonFeedPopup
      options={[
        { value: '/api/json/' + publicKey, label: 'Flycat' },
        //{ value: '/api/json/' + publicKey, label: 'nostri.land' },
      ]}
    />
    <AtomPopup
      options={[
        { value: '/api/atom/' + publicKey, label: 'Flycat' },
        //{ value: '/api/atom/' + publicKey, label: 'nostri.land' },
      ]}
    />
  </div>
);

export default SubscribeFeed;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
