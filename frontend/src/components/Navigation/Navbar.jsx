import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppBar, Toolbar, Box, Typography, IconButton, Avatar, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ onMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Only Chat and Dashboard (if admin/supervisor)
  const navigation = [
    { name: 'Chat', href: '/chat' },
  ];
  if (user && ['admin', 'supervisor'].includes(user.role)) {
    navigation.push({ name: 'Dashboard', href: '/analytics' });
  }

  return (
    <AppBar position="static" elevation={0} color="default" sx={{ border: 'none', borderRadius: 0, background: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Hamburger for mobile */}
          {isMobile && (
            <IconButton onClick={onMobileMenu} size="large" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ width: 36, height: 36, bgcolor: 'grey.100', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </Box>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            Legal AI
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 3, ml: 4 }}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  textDecoration: 'none',
                  color: location.pathname === item.href ? theme.palette.primary.main : theme.palette.text.secondary,
                  fontWeight: location.pathname === item.href ? 600 : 400,
                  fontSize: '1rem',
                  paddingBottom: 2,
                  borderBottom: location.pathname === item.href ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {item.name}
              </Link>
            ))}
          </Box>
          <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 600 }}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 2,
              sx: { mt: 1.5, minWidth: 220, borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {user?.email}
              </Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 500 }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {/* Mobile nav links below bar */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'row', justifyContent: 'center', gap: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            style={{
              textDecoration: 'none',
              color: location.pathname === item.href ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: location.pathname === item.href ? 600 : 400,
              fontSize: '1rem',
              borderBottom: location.pathname === item.href ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
              transition: 'color 0.2s',
            }}
          >
            {item.name}
          </Link>
        ))}
      </Box>
    </AppBar>
  );
};

export default Navbar;
