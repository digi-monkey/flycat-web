import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { EventSetMetadataContent } from 'service/api';
import { UserBox } from '../layout/UserBox';

export interface UserMenuProps {
  pk: string;
  userInfo?: EventSetMetadataContent;
}

export function UserMenu({ pk, userInfo }: UserMenuProps) {
  const menuList = [
    {
      text: 'Profile',
      onClick: () => {
        window.location.href = '/user/' + pk;
      },
    },
    {
      text: 'My Blog',
      onClick: () => {
        window.location.href = '/blog/' + pk;
      },
    },
    {
      text: 'Write',
      onClick: () => {
        window.location.href = '/write';
      },
    },
    {
      text: 'Contact',
      onClick: () => {
        window.location.href = '/contact/' + pk;
      },
    },
    {
      text: 'Private Backup',
      onClick: () => {
        window.location.href = '/backup?local=true';
      },
    },
    {
      text: 'Setting',
      onClick: () => {
        window.location.href = '/setting';
      },
    },
    {
      text: 'Legacy Blog',
      onClick: () => {
        window.location.href = '/legacy-blog';
      },
    },
  ];

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <Box sx={{ flexGrow: 0, textAlign: 'right' }}>
      <Tooltip title="Open settings">
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
          <UserBox
            pk={pk}
            avatar={userInfo?.picture}
            name={userInfo?.name}
            about={userInfo?.about}
          />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {menuList.map(menu => (
          <MenuItem key={menu.text} onClick={menu.onClick}>
            <Typography textAlign="center">{menu.text}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
export default UserMenu;
