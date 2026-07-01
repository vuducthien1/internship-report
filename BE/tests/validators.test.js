const test = require('node:test');
const assert = require('node:assert/strict');
const { registerValidator, resetPasswordValidator, tokenValidator } = require('../validations/authValidation');
const { taskValidator, taskManagerUpdateValidator } = require('../validations/taskValidation');
const {
    updateRoleValidator,
    updateMyProfileValidator,
    adminUpdateProfileValidator,
    changePasswordValidator,
} = require('../validations/userValidation');
const { reviewReportValidator } = require('../validations/reportValidation');
const { contactValidator } = require('../validations/publicValidation');
const {
    taskUpdateValidator,
    taskRequestValidator,
    incidentValidator,
    documentValidator,
    incidentStatusValidator,
} = require('../validations/operationValidation');
const {
    createManagerAssignmentValidator,
    updateManagerAssignmentValidator,
} = require('../validations/managerAssignmentValidation');
const {
    deletionRequestValidator,
    deletionReviewValidator,
} = require('../validations/userDeletionValidation');

const validRegistration = {
    username: 'engineer01',
    fullname: 'Nguyen Van An',
    email: 'engineer01@example.com',
    phone: '0901234567',
    password: 'Password1!',
    confirm_password: 'Password1!',
};

test('public registration accepts an engineer account', () => {
    const { error, value } = registerValidator({
        ...validRegistration,
        role: 'engineer',
    });
    assert.equal(error, undefined);
    assert.equal(value.role, 'engineer');
});

test('public registration rejects manager and admin roles', () => {
    for (const role of ['manager', 'admin']) {
        const { error } = registerValidator({ ...validRegistration, role });
        assert.ok(error, `role ${role} must be rejected`);
    }
});

test('Vietnamese phone validation rejects non-digit separators', () => {
    const { error } = registerValidator({
        ...validRegistration,
        phone: '0|01234567',
    });
    assert.ok(error);
});

test('task priority is allowlisted', () => {
    const baseTask = {
        project_id: 1,
        engineer_id: 2,
        title: 'Kiểm tra chất lượng',
        description: '',
    };
    assert.equal(taskValidator({ ...baseTask, priority: 'critical' }).error, undefined);
    assert.ok(taskValidator({ ...baseTask, priority: 'root' }).error);
});

test('admin role management only allows engineer and manager', () => {
    assert.equal(updateRoleValidator({ role: 'engineer' }).error, undefined);
    assert.equal(updateRoleValidator({ role: 'manager' }).error, undefined);
    assert.ok(updateRoleValidator({ role: 'admin' }).error);
});

test('employee self-service profile ignores official company fields', () => {
    const { error, value } = updateMyProfileValidator({
        fullname: 'Nguyen Van An',
        phone: '0901234567',
        bio: 'Site engineer',
        avatar_url: '',
        role: 'admin',
        email: 'changed@example.com',
        employee_code: 'CEO-01',
    });
    assert.equal(error, undefined);
    assert.equal(value.fullname, undefined);
    assert.equal(value.role, undefined);
    assert.equal(value.email, undefined);
    assert.equal(value.employee_code, undefined);
});

test('admin official profile update ignores immutable username and role', () => {
    const { error, value } = adminUpdateProfileValidator({
        fullname: 'Nguyen Van An',
        email: 'an@example.com',
        phone: '0901234567',
        employee_code: 'ENG-001',
        department: 'Engineering',
        job_title: 'Site Engineer',
        username: 'hacked',
        role: 'admin',
    });
    assert.equal(error, undefined);
    assert.equal(value.username, undefined);
    assert.equal(value.role, undefined);
});

test('rejected report requires a meaningful review note', () => {
    assert.ok(reviewReportValidator({ decision: 'rejected', review_note: '' }).error);
    assert.equal(
        reviewReportValidator({ decision: 'rejected', review_note: 'Thiếu hình ảnh nghiệm thu.' }).error,
        undefined
    );
});

test('password change requires matching strong confirmation', () => {
    assert.equal(changePasswordValidator({
        current_password: 'OldPassword1!',
        new_password: 'NewPassword2@',
        confirm_password: 'NewPassword2@',
    }).error, undefined);
    assert.ok(changePasswordValidator({
        current_password: 'OldPassword1!',
        new_password: 'weak',
        confirm_password: 'different',
    }).error);
});

test('password reset requires a valid token and strong matching password', () => {
    const token = 'a'.repeat(64);
    assert.equal(resetPasswordValidator({
        token,
        password: 'NewPassword2@',
        confirm_password: 'NewPassword2@',
    }).error, undefined);
    assert.ok(resetPasswordValidator({ token: 'invalid', password: 'weak', confirm_password: 'weak' }).error);
    assert.equal(tokenValidator({ token }).error, undefined);
});

test('public contact request validates company input safely', () => {
    const { error, value } = contactValidator({
        fullname: 'Nguyen Van An',
        email: 'an@example.com',
        phone: '0901234567',
        company: 'VDCMS',
        message: 'Tôi muốn được tư vấn triển khai hệ thống.',
        status: 'resolved',
    });
    assert.equal(error, undefined);
    assert.equal(value.status, undefined);
});

test('field task updates reject empty and oversized notes', () => {
    assert.equal(taskUpdateValidator({ message: 'Đã hoàn thành lắp dựng cốt thép.' }).error, undefined);
    assert.ok(taskUpdateValidator({ message: ' ' }).error);
    assert.ok(taskUpdateValidator({ message: 'a'.repeat(1001) }).error);
});

test('extension request requires a date while blocker request does not', () => {
    assert.equal(taskRequestValidator({ task_id: 1, request_type: 'extension', requested_due_date: '2026-07-10', reason: 'Mưa lớn liên tục ảnh hưởng tiến độ thi công.' }).error, undefined);
    assert.ok(taskRequestValidator({ task_id: 1, request_type: 'extension', reason: 'Mưa lớn liên tục ảnh hưởng tiến độ.' }).error);
    assert.equal(taskRequestValidator({ task_id: 1, request_type: 'blocker', reason: 'Chưa có bản vẽ shopdrawing được phê duyệt.' }).error, undefined);
});

test('incident coordinates and severity are strictly validated', () => {
    const valid = { project_id: 1, title: 'Sự cố giàn giáo', description: 'Phát hiện liên kết giàn giáo bị lỏng tại tầng ba.', severity: 'high', latitude: 10.762622, longitude: 106.660172 };
    assert.equal(incidentValidator(valid).error, undefined);
    assert.ok(incidentValidator({ ...valid, severity: 'catastrophic' }).error);
    assert.ok(incidentValidator({ ...valid, latitude: 120 }).error);
});

test('project document metadata requires a meaningful title', () => {
    assert.equal(documentValidator({ project_id: 1, title: 'Bản vẽ kết cấu tầng 3' }).error, undefined);
    assert.ok(documentValidator({ project_id: 1, title: 'A' }).error);
});

test('manager task changes require an audit reason and safe status', () => {
    const valid = { engineer_id: 2, title: 'Kiểm tra cốt thép tầng 3', description: '', due_date: '2026-07-10', priority: 'high', status: 'on_hold', change_reason: 'Chờ bản vẽ điều chỉnh được duyệt.' };
    assert.equal(taskManagerUpdateValidator(valid).error, undefined);
    assert.ok(taskManagerUpdateValidator({ ...valid, change_reason: '' }).error);
    assert.ok(taskManagerUpdateValidator({ ...valid, status: 'deleted' }).error);
});

test('resolved incidents accept corrective action metadata', () => {
    const { error } = incidentStatusValidator({ status: 'resolved', assigned_to: 2, root_cause: 'Liên kết bị lỏng', corrective_action: 'Siết lại và kiểm tra toàn bộ', target_resolution_date: '2026-07-05' });
    assert.equal(error, undefined);
});

test('admin manager assignment requires a real objective and valid manager', () => {
    const valid = {
        manager_id: 2,
        project_id: 1,
        title: 'Điều phối nghiệm thu tầng ba',
        description: 'Tổ chức nhân sự, hồ sơ và lịch nghiệm thu với các bên liên quan.',
        due_date: '2099-07-15',
        priority: 'high',
    };
    assert.equal(createManagerAssignmentValidator(valid).error, undefined);
    assert.ok(createManagerAssignmentValidator({ ...valid, manager_id: 0 }).error);
    assert.ok(createManagerAssignmentValidator({ ...valid, description: 'Ngắn' }).error);
});

test('manager assignment progress is bounded and completion is allowlisted', () => {
    assert.equal(updateManagerAssignmentValidator({ status: 'in_progress', progress_percent: 45, manager_note: 'Đã hoàn thành phần chuẩn bị.' }).error, undefined);
    assert.ok(updateManagerAssignmentValidator({ status: 'deleted', progress_percent: 20 }).error);
    assert.ok(updateManagerAssignmentValidator({ status: 'completed', progress_percent: 101 }).error);
});

test('user deletion workflow requires a meaningful reason and rejection note', () => {
    assert.equal(deletionRequestValidator({ user_id: 3, reason: 'Nhân sự đã chấm dứt hợp đồng lao động.' }).error, undefined);
    assert.ok(deletionRequestValidator({ user_id: 3, reason: 'Nghỉ' }).error);
    assert.equal(deletionReviewValidator({ decision: 'approved', review_note: '' }).error, undefined);
    assert.ok(deletionReviewValidator({ decision: 'rejected', review_note: '' }).error);
});
