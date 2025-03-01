// to handle try-catch stmts
module.exports = (asyncFunc) => {
    return (req, res, next) => { // returns middleware
        asyncFunc(req, res, next).catch((err) => { // catchs any error happen in asyncFunc
            next(err); /*runs next middleware*/ // goes to meddleware3 in index.js
        }); // .catch() can only be used with async functions
    }
};