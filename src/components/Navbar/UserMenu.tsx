import { Paths } from 'constants/path';
import { UserBox } from '../layout/UserBox';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { EventSetMetadataContent } from 'service/api';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

export interface UserMenuProps {
  pk: string;
  userInfo?: EventSetMetadataContent;
}

export function UserMenu({ pk, userInfo }: UserMenuProps) {
  const router = useRouter();
  const menuList = [
    {
      text: 'Profile',
      onClick: () => router.push({ pathname: Paths.user + pk}),
    },
    {
      text: 'My Blog',
      onClick: () => router.push({ pathname: `${Paths.blog}/${pk}`}),
    },
    {
      text: 'Write',
      onClick: () => router.push({ pathname: Paths.write}),
    },
    {
      text: 'Contact',
      onClick: () => router.push({ pathname: `${Paths.contact + pk}`}),
    },
    {
      text: 'Private Backup',
      onClick: () => router.push({ pathname: Paths.backup, query: { local: true }}),
    },
    {
      text: 'Setting',
      onClick: () => router.push({ pathname: Paths.setting}),
    },
    {
      text: 'Legacy Blog',
      onClick: () => router.push({ pathname: Paths.legacy_blog}),
    },
  ];

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(
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
