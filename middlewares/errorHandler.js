module.exports = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        console.error(err.message);
    } else {
        console.error(err);
    }
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
};