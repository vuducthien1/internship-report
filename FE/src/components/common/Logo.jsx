import logoSrc from '../../assets/Logo.png';

const Logo = ({ size = 40, className = '', alt = 'VDCMS Logo', style = {} }) => (
    <img
        src={logoSrc}
        alt={alt}
        className={`app-logo ${className}`}
        style={{ width: size, height: size, objectFit: 'contain', ...style }}
    />
);

export default Logo;
