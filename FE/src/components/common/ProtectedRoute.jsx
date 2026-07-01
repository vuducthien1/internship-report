import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Forbidden from '../../pages/shared/Forbidden';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>{t('loading')}</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Forbidden />;
    }

    return children;
};

export default ProtectedRoute;
