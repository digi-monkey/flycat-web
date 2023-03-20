import { Grid } from '@mui/material';
import { Paths } from 'constants/path';
import { Search } from '@mui/icons-material';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';

import Nav from './Nav';
import Link from 'next/link';
import styled from 'styled-components';
import LoginCard from './LoginCard';

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

export function NavHeader({ title, link }: NavHeaderProps) {
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item xs={12} sm={6}>
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
        <Grid item xs={12} sm={6}>
          <div style={{ textAlign: 'right' }}>
            <SearchBox />
          </div>
        </Grid>
      }
    </Grid>
  );
}

export const SearchBox = () => {
  return (
    <div
      style={{
        //boxShadow: 'inset 0 0 1px #aaa',
        //border: '1px solid rgb(216 222 226)',
        borderRadius: '5px',
        background: '#F4F5F4',
        padding: '5px',
        // margin: '5px 0px 0px 0px',
        display: 'flex',
      }}
    >
      <input
        type="text"
        //placeholder="unavailable"
        style={{
          border: 'none',
          maxWidth: '85%',
          width: '400px',
          // padding: '5px',
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

export const MenuListDefault = connect(loginMapStateToProps)(Nav);

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
      <button
        style={{
          ...{ border: 'none', background: 'lightsteelblue' },
          ...style,
        }}
        type="button"
        onClick={() => {
          setIsOpenLoginForm(!isOpenLoginForm);
        }}
      >
        {text || t('nav.menu.signIn')}
      </button>
      {isOpenLoginForm && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            zIndex: 999,
            width: '400px',
            height: 'auto',
            boxShadow: '0px 0px 10px #ccc',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <LoginCard onCancel={() => setIsOpenLoginForm(false)} />
        </div>
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 998,
          background: 'black',
          opacity: 0.5,
          filter: 'blur(5px)',
          display: isOpenLoginForm ? 'block' : 'none',
        }}
      ></div>
    </>
  );
};
