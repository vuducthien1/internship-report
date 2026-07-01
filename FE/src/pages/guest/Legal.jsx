import { useLanguage } from '../../context/LanguageContext';

const content = {
    vi: {
        terms: {
            title: 'Điều khoản sử dụng',
            intro: 'Các điều khoản này quy định việc sử dụng hệ thống VDCMS trong môi trường doanh nghiệp.',
            sections: [
                ['Tài khoản và quyền truy cập', 'Người dùng phải cung cấp thông tin chính xác, bảo mật thông tin đăng nhập và chỉ sử dụng quyền được doanh nghiệp cấp.'],
                ['Dữ liệu công trường', 'Báo cáo, hình ảnh và tài liệu tải lên phải thuộc phạm vi công việc được giao và không vi phạm quyền của bên thứ ba.'],
                ['Hành vi bị cấm', 'Không được truy cập trái phép, phá hoại hệ thống, chia sẻ tài khoản hoặc sử dụng dữ liệu ngoài mục đích công việc.'],
                ['Thay đổi dịch vụ', 'Doanh nghiệp có thể cập nhật tính năng và chính sách để đáp ứng yêu cầu vận hành và bảo mật.'],
            ],
        },
        privacy: {
            title: 'Chính sách bảo mật',
            intro: 'VDCMS chỉ thu thập dữ liệu cần thiết để quản lý tài khoản và hoạt động công trường.',
            sections: [
                ['Dữ liệu được thu thập', 'Thông tin tài khoản, thông tin liên hệ, nhật ký hoạt động, báo cáo công việc và tệp đính kèm.'],
                ['Mục đích sử dụng', 'Xác thực người dùng, phân công công việc, theo dõi tiến độ, phê duyệt báo cáo và bảo vệ hệ thống.'],
                ['Bảo vệ dữ liệu', 'Mật khẩu được băm, API được phân quyền và các thao tác quan trọng được ghi nhật ký.'],
                ['Quyền của người dùng', 'Người dùng có thể cập nhật thông tin cá nhân cho phép và liên hệ quản trị viên để yêu cầu hỗ trợ dữ liệu.'],
            ],
        },
    },
    en: {
        terms: {
            title: 'Terms of Service',
            intro: 'These terms govern the use of VDCMS in a company environment.',
            sections: [
                ['Accounts and access', 'Users must provide accurate information, protect credentials, and only use permissions granted by the company.'],
                ['Site data', 'Reports, images, and documents must relate to assigned work and respect third-party rights.'],
                ['Prohibited conduct', 'Unauthorized access, system disruption, account sharing, and non-work use of data are prohibited.'],
                ['Service changes', 'The company may update features and policies to meet operational and security requirements.'],
            ],
        },
        privacy: {
            title: 'Privacy Policy',
            intro: 'VDCMS collects only the data required for account and construction-site operations.',
            sections: [
                ['Data collected', 'Account details, contact information, activity logs, work reports, and attachments.'],
                ['How data is used', 'Authentication, task assignment, progress tracking, report approval, and system protection.'],
                ['Data protection', 'Passwords are hashed, APIs are role-protected, and important actions are logged.'],
                ['User rights', 'Users may update permitted profile fields and contact administrators for data support.'],
            ],
        },
    },
};

const Legal = ({ type }) => {
    const { language } = useLanguage();
    const page = content[language]?.[type] || content.vi[type];
    return (
        <article className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40 sm:p-10">
            <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
            <p className="mt-3 leading-7 text-slate-600">{page.intro}</p>
            <div className="mt-8 space-y-6">
                {page.sections.map(([title, description]) => (
                    <section key={title}>
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                        <p className="mt-2 leading-7 text-slate-600">{description}</p>
                    </section>
                ))}
            </div>
        </article>
    );
};

export default Legal;
