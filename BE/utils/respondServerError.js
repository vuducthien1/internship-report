const respondServerError = (res, error) => {
    console.error('Controller error:', error);
    return res.status(500).json({
        success: false,
        message: 'Máy chủ gặp lỗi. Vui lòng thử lại sau.',
    });
};

module.exports = respondServerError;
