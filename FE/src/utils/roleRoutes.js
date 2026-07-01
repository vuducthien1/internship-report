export const ROLE_HOME = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    engineer: '/engineer/dashboard',
};

export const getRoleHome = (role) => ROLE_HOME[role] || '/';
