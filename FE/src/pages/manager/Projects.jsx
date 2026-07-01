import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    getProjectsApi,
    createProjectApi,
    updateProjectApi,
    deleteProjectApi,
} from '../../services/projectService';
import { getManagersApi } from '../../services/userService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import SearchableSelect from '../../components/common/SearchableSelect';
import DataTable from '../../components/common/DataTable';

const emptyForm = {
    name: '',
    description: '',
    location: '',
    manager_id: '',
    start_date: '',
    end_date: '',
    status: 'planning',
};

function ManagerProjects() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const viewMode = searchParams.get('view') === 'create' ? 'create' : 'manage';
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const changeView = (view) => {
        setSearchParams({ view });
        setError('');
        if (view === 'create') {
            setSelectedProject(null);
            setIsEditing(false);
            setFormData({
                ...emptyForm,
                manager_id: isAdmin ? '' : user.id,
            });
        }
    };

    const fetchManagers = useCallback((search) => getManagersApi(search), []);

    useEffect(() => {
        const fetchProjects = async () => {
            const data = await getProjectsApi();
            if (data.success) {
                setProjects(data.data);
                setError('');
            } else {
                setError(data.message);
            }
        };
        fetchProjects();
    }, [refreshKey]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const data = await createProjectApi({
            ...formData,
            manager_id: isAdmin ? Number(formData.manager_id) : user.id,
        });

        if (data.success) {
            setFormData(emptyForm);
            setSuccess(data.message);
            setRefreshKey((k) => k + 1);
            changeView('manage');
        } else {
            setError(data.message);
        }
        setSaving(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const data = await updateProjectApi(selectedProject.id, {
            ...formData,
            manager_id: Number(formData.manager_id),
        });

        if (data.success) {
            setShowDetailModal(false);
            setIsEditing(false);
            setSelectedProject(null);
            setFormData(emptyForm);
            setSuccess(data.message);
            setRefreshKey((k) => k + 1);
        } else {
            setError(data.message);
        }
        setSaving(false);
    };

    const openEdit = (proj, e) => {
        e?.stopPropagation();
        openDetail(proj);
        setIsEditing(true);
    };

    const handleDeleteProject = async (proj, e) => {
        e?.stopPropagation();
        if (!window.confirm(t('deleteConfirm'))) return;

        setSaving(true);
        const data = await deleteProjectApi(proj.id);

        if (data.success) {
            setShowDetailModal(false);
            setSelectedProject(null);
            setSuccess(data.message);
            setRefreshKey((k) => k + 1);
        } else {
            setError(data.message);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(t('deleteConfirm'))) return;

        setSaving(true);
        const data = await deleteProjectApi(selectedProject.id);

        if (data.success) {
            setShowDetailModal(false);
            setSelectedProject(null);
            setSuccess(data.message);
            setRefreshKey((k) => k + 1);
        } else {
            setError(data.message);
        }
        setSaving(false);
    };

    const openDetail = (proj) => {
        setSelectedProject(proj);
        setFormData({
            name: proj.name,
            description: proj.description || '',
            location: proj.location,
            manager_id: proj.manager_id,
            start_date: proj.start_date?.split('T')[0] || proj.start_date,
            end_date: proj.end_date?.split('T')[0] || proj.end_date,
            status: proj.status || 'planning',
        });
        setIsEditing(false);
        setShowDetailModal(true);
        setError('');
    };

    const getStatusLabel = (status) => {
        if (status === 'planning') return t('planning');
        if (status === 'ongoing') return t('statusOngoing');
        if (status === 'completed') return t('statusCompleted');
        return status;
    };

    const getStatusBadge = (status) => {
        if (status === 'planning') return 'badge-planning';
        if (status === 'completed') return 'badge-success';
        return 'badge-info';
    };

    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    const projectColumns = [
        {
            key: 'name',
            label: t('projectName'),
            cellClassName: 'font-semibold text-slate-900',
            render: (row) => (
                <button type="button" className="font-semibold text-indigo-600 hover:underline" onClick={() => isAdmin ? openDetail(row) : navigate(`/manager/projects/${row.id}`)}>
                    {row.name}
                </button>
            ),
        },
        { key: 'location', label: t('location') },
        { key: 'manager_name', label: t('manager') },
        {
            key: 'status',
            label: t('status'),
            value: (row) => getStatusLabel(row.status),
            render: (row) => <span className={`badge ${getStatusBadge(row.status)}`}>{getStatusLabel(row.status)}</span>,
        },
        {
            key: 'start_date',
            label: t('startDate'),
            sortValue: (row) => new Date(row.start_date).getTime(),
            render: (row) => new Date(row.start_date).toLocaleDateString(locale),
        },
        {
            id: 'actions',
            label: t('actions'),
            sortable: false,
            searchable: false,
            render: (row) => (
                <div className="flex min-w-max flex-wrap gap-2">
                    {!isAdmin && <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate(`/manager/projects/${row.id}`)}>
                        {t('viewDetails')}
                    </button>}
                    <button type="button" className="btn btn-sm btn-primary" onClick={(event) => openEdit(row, event)}>
                        {t('editProject')}
                    </button>
                    {isAdmin && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteProject(row)} disabled={saving}>
                        {t('deleteProject')}
                    </button>}
                </div>
            ),
        },
    ];

    const renderProjectForm = (onSubmit, submitLabel) => (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('projectName')}</label>
                    <input type="text" name="name" className="form-input" value={formData.name} required onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('location')}</label>
                    <input type="text" name="location" className="form-input" value={formData.location} required onChange={handleChange} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{t('description')}</label>
                <textarea name="description" className="form-textarea" value={formData.description} onChange={handleChange} rows={5} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {isAdmin ? (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t('manager')}</label>
                        <SearchableSelect
                            value={formData.manager_id}
                            onChange={(id) => setFormData({ ...formData, manager_id: id })}
                            fetchOptions={fetchManagers}
                            placeholder={t('selectManager')}
                            selectedLabel={isEditing ? selectedProject?.manager_name || '' : ''}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t('manager')}</label>
                        <input className="form-input" value={user?.fullname || user?.username || ''} disabled />
                    </div>
                )}
                {isEditing ? (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t('status')}</label>
                        <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                            <option value="planning">{t('planning')}</option>
                            <option value="ongoing">{t('statusOngoing')}</option>
                            <option value="completed">{t('statusCompleted')}</option>
                        </select>
                    </div>
                ) : <div />}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('startDate')}</label>
                    <input type="date" name="start_date" className="form-input" value={formData.start_date} required onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('endDate')}</label>
                    <input type="date" name="end_date" className="form-input" value={formData.end_date} required onChange={handleChange} />
                </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || (isAdmin && !formData.manager_id)}
                >
                    {saving ? t('processing') : submitLabel}
                </button>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                        if (showDetailModal) {
                            setIsEditing(false);
                            if (!isAdmin) setShowDetailModal(false);
                        } else {
                            changeView('manage');
                        }
                    }}
                >
                    {t('cancel')}
                </button>
            </div>
        </form>
    );

    const renderDetailView = () => (
        <div className="project-detail-view">
            <div className="detail-row">
                <span className="detail-label">{t('projectName')}</span>
                <span className="detail-value">{selectedProject.name}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('description')}</span>
                <span className="detail-value">{selectedProject.description || '—'}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('location')}</span>
                <span className="detail-value">{selectedProject.location}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('manager')}</span>
                <span className="detail-value">{selectedProject.manager_name}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('status')}</span>
                <span className={`badge ${getStatusBadge(selectedProject.status)}`}>
                    {getStatusLabel(selectedProject.status)}
                </span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('startDate')}</span>
                <span className="detail-value">{new Date(selectedProject.start_date).toLocaleDateString(locale)}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">{t('endDate')}</span>
                <span className="detail-value">{new Date(selectedProject.end_date).toLocaleDateString(locale)}</span>
            </div>

            <div className="modal-actions">
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>{t('editProject')}</button>
                {isAdmin && <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>{t('deleteProject')}</button>}
                <button type="button" className="btn btn-outline" onClick={() => setShowDetailModal(false)}>{t('cancel')}</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title={viewMode === 'create' ? t('createProject') : t('projectList')}
                subtitle={t('featureProjectDesc')}
                useLogo
                action={(
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm shadow-sm">
                        <button
                            type="button"
                            className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'create' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => changeView('create')}
                        >
                            + {t('addProject')}
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => changeView('manage')}
                        >
                            {t('projectList')}
                        </button>
                    </div>
                )}
            />

            {error && <div className="alert alert-error">{t('error')}: {error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {viewMode === 'create' ? (
                <div className="rounded-[2rem] bg-white/95 p-6 shadow-lg shadow-slate-200/40">
                    <div className="mb-6 rounded-3xl bg-slate-50 p-5 text-slate-600">
                        <p>{t('featureProjectDesc')}</p>
                    </div>
                    {renderProjectForm(handleCreate, t('save'))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40">
                            <p className="text-sm text-slate-500">{t('statsProjects')}</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{projects.length}</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40">
                            <p className="text-sm text-slate-500">{t('statusOngoing')}</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{projects.filter((project) => project.status === 'ongoing').length}</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40">
                            <p className="text-sm text-slate-500">{t('statusCompleted')}</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{projects.filter((project) => project.status === 'completed').length}</p>
                        </div>
                    </div>
                    <DataTable columns={projectColumns} data={projects} emptyText={t('noProjects')} />
                </div>
            )}
            {showDetailModal && selectedProject && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{isEditing ? t('editProject') : t('projectDetails')}</h3>
                        </div>
                        {isEditing ? renderProjectForm(handleUpdate, t('save')) : renderDetailView()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagerProjects;
