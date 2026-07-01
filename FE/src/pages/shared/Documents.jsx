import { useCallback, useEffect, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { downloadDocumentApi, getDocumentsApi, uploadDocumentApi } from '../../services/documentService';
import { getProjectsApi } from '../../services/projectService';

const Documents = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const vi = language === 'vi';
    const canUpload = ['admin', 'manager'].includes(user?.role);
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = canUpload && searchParams.get('view') === 'upload' ? 'upload' : 'manage';
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({ project_id: '', title: '' });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const [documentResult, projectResult] = await Promise.all([getDocumentsApi(), canUpload ? getProjectsApi() : Promise.resolve({ success: true, data: [] })]);
        if (documentResult.success) setDocuments(documentResult.data); else setError(documentResult.message);
        if (projectResult.success) setProjects(projectResult.data);
        setLoading(false);
    }, [canUpload]);
    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const submit = async (event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        if (!file) return;
        setUploading(true); setError(''); setSuccess('');
        const result = await uploadDocumentApi(form, file);
        if (result.success) { setSuccess(result.message); setForm({ project_id: '', title: '' }); setFile(null); formElement.reset(); setSearchParams({ view: 'manage' }); await load(); }
        else setError(result.message);
        setUploading(false);
    };
    const download = async (document) => {
        setError('');
        try { await downloadDocumentApi(document); } catch (downloadError) { setError(downloadError.message); }
    };
    const formatSize = (value) => value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`;
    const columns = [
        { key: 'title', label: vi ? 'Tên tài liệu' : 'Document', cellClassName: 'font-semibold text-slate-900' },
        { key: 'project_name', label: vi ? 'Dự án' : 'Project' },
        { key: 'version', label: vi ? 'Phiên bản' : 'Version', render: (r) => <span className="badge badge-info">v{r.version}</span> },
        { key: 'file_name', label: vi ? 'Tên file' : 'File name' },
        { key: 'file_size', label: vi ? 'Dung lượng' : 'Size', render: (r) => formatSize(Number(r.file_size || 0)) },
        { key: 'storage_provider', label: vi ? 'Lưu trữ' : 'Storage', render: (r) => <span className={`badge ${r.storage_provider === 'amazon-s3' ? 'badge-success' : 'badge-info'}`}>{r.storage_provider === 'amazon-s3' ? 'Amazon S3' : 'Local'}</span> },
        { key: 'uploaded_by_name', label: vi ? 'Người tải lên' : 'Uploaded by' },
        { key: 'created_at', label: vi ? 'Ngày cập nhật' : 'Updated', sortValue: (r) => new Date(r.created_at).getTime(), render: (r) => new Date(r.created_at).toLocaleString(vi ? 'vi-VN' : 'en-US') },
        { id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (r) => <button className="btn btn-outline btn-sm" onClick={() => download(r)}><Download size={15} /> {vi ? 'Tải xuống' : 'Download'}</button> },
    ];

    const projectCount = new Set(documents.map((document) => document.project_id)).size;
    const s3Count = documents.filter((document) => document.storage_provider === 'amazon-s3').length;

    return (
        <div className="space-y-8">
            <PageHeader
                title={viewMode === 'upload' ? (vi ? 'Tải tài liệu dự án' : 'Upload project document') : (vi ? 'Danh sách tài liệu dự án' : 'Project document list')}
                subtitle={vi ? 'Bản vẽ, biện pháp thi công và biểu mẫu được quản lý theo phiên bản.' : 'Versioned drawings, method statements and field forms.'}
                useLogo
                action={canUpload ? (
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm shadow-sm">
                        <button type="button" className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'upload' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => { setSearchParams({ view: 'upload' }); setError(''); }}>
                            + {vi ? 'Tải tài liệu' : 'Upload document'}
                        </button>
                        <button type="button" className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => { setSearchParams({ view: 'manage' }); setError(''); }}>
                            {vi ? 'Danh sách tài liệu' : 'Document list'}
                        </button>
                    </div>
                ) : undefined}
            />

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {canUpload && viewMode === 'upload' ? (
                <div className="rounded-[2rem] bg-white/95 p-6 shadow-lg shadow-slate-200/40">
                    <div className="mb-6 rounded-3xl bg-slate-50 p-5 text-slate-600">
                        <div className="flex items-start gap-3">
                            <Upload className="mt-0.5 shrink-0 text-indigo-600" size={22} />
                            <div>
                                <h2 className="font-semibold text-slate-900">{vi ? 'Tải tài liệu / phiên bản mới' : 'Upload a document / new version'}</h2>
                                <p className="mt-1 text-sm">{vi ? 'Giữ nguyên tên tài liệu để hệ thống tự động tăng số phiên bản.' : 'Keep the same document title to create the next version automatically.'}</p>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Dự án' : 'Project'}</span><select required className="form-select" value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })}><option value="">{vi ? 'Chọn dự án' : 'Select project'}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
                            <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Tên tài liệu' : 'Document title'}</span><input required minLength={3} maxLength={180} className="form-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
                            <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Chọn file, tối đa 25 MB' : 'Choose a file, max 25 MB'}</span><input required className="form-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.dwg" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <button className="btn btn-primary" disabled={uploading} type="submit"><Upload size={17} /> {uploading ? (vi ? 'Đang tải...' : 'Uploading...') : (vi ? 'Tải tài liệu lên' : 'Upload document')}</button>
                            <button type="button" className="btn btn-outline" onClick={() => setSearchParams({ view: 'manage' })}>{vi ? 'Hủy' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Tổng tài liệu' : 'Total documents'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{documents.length}</p></div>
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Dự án có tài liệu' : 'Projects with documents'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{projectCount}</p></div>
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Lưu trên Amazon S3' : 'Stored on Amazon S3'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{s3Count}</p></div>
                    </div>
                    <DataTable columns={columns} data={documents} loading={loading} emptyText={vi ? 'Chưa có tài liệu dự án.' : 'No project documents.'} />
                </div>
            )}
        </div>
    );
};

export default Documents;
