import { Grid } from '@mui/material';
import { Paths } from 'constants/path';
import { Search } from '@mui/icons-material';
import { useState } from 'react';
import { RelaySelector } from 'components/RelaySelector';
import { useTranslation } from 'next-i18next';

import Link from 'next/link';

const styles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '20px',
    fontWeight: '600',
    display: 'inline-flex',
    width: '100%',
  },
  ul: {
    padding: '0px 10px 0px 0px',
    borderRadius: '5px',
    listStyleType: 'none' as const,
  },
  li: {
    padding: '10px 0px',
    marginBottom: '5px',
    // background: "gray",
    //todo hover effect
    // width: "fit-content" as const,
    borderRadius: '5px',
    color: 'gray',
  },
  link: {
    color: 'white',
    textDecoration: 'none' as const,
  },
};

export interface NavHeaderProps {
  title?: string;
  link?: string;
}

export const SearchBox = () => {
  return (
    <div
      style={{
        borderRadius: '5px',
        background: '#F4F5F4',
        padding: '5px',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <input
        type="text"
        // placeholder="unavailable"
        style={{
          border: 'none',
          maxWidth: '85%',
          width: '400px',
          outline: 'none',
          background: '#F4F5F4',
        }}
      />
      <button
        type="button"
        style={{
          border: 'none',
          background: 'none',
          padding: '0px 5px',
          fontSize: 'small',
        }}
        //disabled={true}
        onClick={() => {
          alert('working on it!');
        }}
      >
        <Search />
      </button>
    </div>
  );
};

export function NavHeader({ title, link }: NavHeaderProps) {
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item xs={12} sm={4}>
        <div>
          <Grid container>
            <div style={styles.title}>
              <Link href={link || Paths.home}>
                {title || t('nav.menu.home')}
              </Link>
            </div>
          </Grid>
        </div>
      </Grid>
      {
        <Grid item xs={12} sm={8}>
          <div style={{ textAlign: 'right' }}>
            <RelaySelector />
          </div>
        </Grid>
      }
    </Grid>
  );
}

export const LoginFormTip = ({
  style = {},
  text,
}: {
  style?: React.CSSProperties;
  text?: string;
}) => {
  const { t } = useTranslation();
  const [isOpenLoginForm, setIsOpenLoginForm] = useState<boolean>(false);
  return (
    <>
      <a
        style={{
          ...{ border: 'none', background: 'lightsteelblue' },
          ...style,
        }}
      href={Paths.login}
      >
        {text || t('nav.menu.signIn')}
      </a>
    </>
  );
};
