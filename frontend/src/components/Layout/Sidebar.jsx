import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography, // Добавляем импорт Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  BarChart as AnalyticsIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const userMenuItems = [
  { text: 'Главная', icon: <DashboardIcon />, path: '/' },
  { text: 'Мои книги', icon: <BookIcon />, path: '/books' },
  { text: 'Аналитика', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Отчеты', icon: <DescriptionIcon />, path: '/reports' },
];

const adminMenuItems = [
  { text: 'Авторы', icon: <PeopleIcon />, path: '/authors' },
  { text: 'Жанры', icon: <CategoryIcon />, path: '/genres' },
  { text: 'Издательства', icon: <BusinessIcon />, path: '/publishers' },
  { text: 'Статусы книг', icon: <BookmarkIcon />, path: '/statuses' },
  { text: 'Пользователи', icon: <PeopleIcon />, path: '/users' },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {userMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {isAdmin() && (
        <>
          <Divider />
          <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Администрирование
          </Typography>
          <List>
            {adminMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;