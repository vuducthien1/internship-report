import { Outlet } from 'react-router-dom';

const GuestLayout = () => (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        <Outlet /> 
    </div>
);
export default GuestLayout;