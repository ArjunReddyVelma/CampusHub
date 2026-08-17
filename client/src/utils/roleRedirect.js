export const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  professor: '/professor/dashboard',
  club_admin: '/club/dashboard',
  judge: '/judge/dashboard',
  admin: '/admin/dashboard'
};

export const getDashboardPath = (role) => {
  return ROLE_DASHBOARDS[role] || '/';
};
