var User = require('../app/model');
var path = require("path");
var jwt = require('jsonwebtoken');
var secret = "harry";

module.exports = function(router){

    router.post('/register', (req, res) => {
        var user = new User();

        user.name = req.body.name;
        user.email = req.body.email;
        user.mobile = req.body.mobile;
        user.password = req.body.password;
        user.address = req.body.address;
        user.gender = req.body.gender;
        // user.temporarytoken = jwt.sign({ name: user.name, email: user.email, address: user.address, mobile: user.mobile }, secret, { expiresIn: '24h' });

        user.save(function(err){
            if(err){
                console.log("21 :", err);
                if (err.errors != null) {
                    if (err.errors.name) {
                        res.json({ success: false, message: err.errors.name.message });
                    }else if (err.errors.email) {
                        res.json({ success: false, message: err.errors.email.message }); 
                    } else if (err.errors.mobile) {
                        res.json({ success: false, message: err.errors.mobile.message });
                    } else if (err.errors.password) {
                        res.json({ success: false, message: err.errors.password.message });
                    } else {
                        res.json({ success: false, message: err }); 
                    }
                } else if (err){
                    console.log("35 :", err);
                    if (err.code == 11000) {
                        //  res.json({ success: false, message: err.errmsg[61] });
                        if (err.errmsg[61] == "x") {
                            res.json({ success: false, message: 'That E-mail, mobile is already taken' });
                        }
                    } else{
                        res.json({ success: false, message: err });
                    }
                }
            }else{
                res.json({ success: true, message: 'Account registered !' });
            }
        })
    })

    //http://localhost:8080/api/authenticate
    router.post('/authenticate', function(req, res){
        User.findOne({ $or: [{email: req.body.email}, { mobile: req.body.mobile}] }).select('email password').exec(function(err, user) {
            if (err) throw err;
            else {
                if (!user) {
                    res.json({ success: false, message: 'E-mail not found' });
                } else if (user) {
                    if (!req.body.password) {
                        res.json({ success: false, message: 'No password provided' });
                    } else {
                        var validPassword = user.comparePassword(req.body.password);
                        //var validPassword = req.body.password;
                        if (!validPassword) {
                            res.json({ success: false, message: 'Could not authenticate password' });
                        } else{
                            var token = jwt.sign({ email: user.email }, secret, { expiresIn: '24h' }); 
                            res.json({ success: true, message: 'User authenticated!', token: token });
                        }             
                    }
                }
            }   
        });
    });

    router.post('/checkmobile', function(req, res) {
        User.findOne({ mobile: req.body.mobile }).select('mobile').exec(function(err, user) {
            if (err) throw err;

            if (user) {
                res.json({ success: false, message: 'That mobile number is already taken' });
            } else {
                res.json({ success: true, message: 'Valid mobile number' }); 
            }
        }) 
    });

    router.post('/checkemail', function(req, res) {
        User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
            if (err) throw err;

            if (user) {
                res.json({ success: false, message: 'That e-mail is already taken' });
            } else {
                res.json({ success: true, message: 'Valid e-mail' }); 
            }
        })
    });

    router.put('/savepassword', function(req, res) {
        User.findOne({ email: req.body.email }).select('email password').exec(function(err, user) {
            if (err) throw err;
            if (req.body.password == null || req.body.password == '') {
                res.json({ success: false, message: 'Password not provided' });
            } else {
                user.password = req.body.password;

                user.save(function(err) {
                    if (err) {
                        res.json({ success: false, message: err });
                    } else {
                        res.json({ success: true, message: 'Password has been reset!' }); 
                    }
                });
            }
        });
    });

    router.use(function(req, res, next) {

        var token = req.body.token || req.body.query || req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, secret, function(err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Token invalid' });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            res.json({ success: false, message: 'No token provided' });
        }
    });
    
    router.post('/me', function(req, res) {
    
        let email = req.decoded.email;

        User.findOne({ email: email}).exec( (err, user) => {
            if(err) {
                console.log(err);
            } else {
                res.json({ success: true, data: user});
            }
        })
    });

    router.delete('/delete', function(req, res) {
        var editUser = req.query._id;
        User.findOne({ email: req.decoded.email }, function(err, mainUser) {
            if(err) throw err;
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' });
            } else {
                User.findOneAndRemove({ _id: editUser }, function(err, user) {
                    if(err) throw err;
                    res.json({ success: true, message: 'Your Account successfully delete ' });
                });
            }
        });
    });

    router.put('/edit', function(req, res) {
        var editUser = req.query._id;
        User.findOne({ email: req.decoded.email }, function(err, mainUser) {
            if (err) throw err;
            if (!mainUser) {
                res.json({ success: false, message: "no user found" });
            } else{
                User.findOne({ _id: editUser }, function(err, user) {
                    if (err) throw err;
                    if (!user) {
                        res.json({ success: false, message: 'No user found' });
                    } else{
                        user.name = req.body.name;
                        user.mobile = req.body.mobile;
                        user.email = req.body.email;
                        user.address = req.body.address;

                        user.save(function(err) {
                            if (err) {
                                console.log(err); 
                            } else {
                                res.json({ success: true, message: 'Your details has been updated!' });
                            }
                        });
                    }
                });
            }
        });
    });

    router.get('/allusers', function(req, res) {
        User.find({email: { $ne: req.decoded.email }}, function(err, users) {
            if(err) throw err;
            User.findOne({ email: req.decoded.email }, function(err, mainUser) {
                if (!mainUser) {
                    res.json({ success: false, message: 'No user found' });
                } else{
                    if (!users) {
                        res.json({ success: false, message: 'Users not found' }); 
                    } else {
                        res.json({ success: true, data: users });
                    }
                }
            });
        }); 
    });

    return router;
}