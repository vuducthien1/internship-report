import { apiGet, apiPatch, apiPost, apiPut } from './apiClient';

export const getMyTasksApi = () => apiGet('/tasks/my-tasks');
export const getEngineerDashboardApi = () => apiGet('/tasks/engineer-dashboard');
export const getTasksApi = () => apiGet('/tasks');
export const createTaskApi = (taskData) => apiPost('/tasks', taskData);
export const updateTaskApi = (taskId, taskData) => apiPut(`/tasks/${taskId}`, taskData);
export const getTaskDetailsApi = (taskId) => apiGet(`/tasks/${taskId}/details`);
export const addTaskUpdateApi = (taskId, message) => apiPost(`/tasks/${taskId}/updates`, { message });
export const getTaskChecklistApi = (taskId) => apiGet(`/tasks/${taskId}/checklist`);
export const updateChecklistItemApi = (taskId, itemId, completed) =>
    apiPatch(`/tasks/${taskId}/checklist/${itemId}`, { completed });
