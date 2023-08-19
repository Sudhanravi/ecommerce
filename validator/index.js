exports.userSignupValidator = (req, res, next) =>{
    req.check('name', 'Name is required').notEmpty();
    req.check('email', 'Email must be between 4 and 32 characters and contain @')
    .isLength({ min: 4, max: 32 })
    .matches(/^.+@.+\..+$/)
    .withMessage('Email must contain @');
    req.check('password', 'Password is required').notEmpty();
    req.check('password').isLength({min:6}).withMessage('Password must contain atleast 6 character')
              .matches(/\d/).withMessage('Password must contain a number');
    
    const errors = req.validationErrors()
    if (errors){
        const firstError = errors.map(error => error.msg)[0];
        return res.status (400).json({error: firstError});
    }
    next();
};