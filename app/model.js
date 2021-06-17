var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');

var nameValidator = [
    validate({
        validator: 'matches',
        arguments: /^(([a-zA-Z]{3,20})+[ ]+([a-zA-Z]{3,20})+)+$/,
        message: 'Name must be at least 3 characters, max 30, no special characters or numbers, must have space in between name.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 20],
        message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

var emailValidator = [
    validate({
        validator: 'matches',
        arguments: /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/,
        message: 'Email must be at least 3 characters, max 40, no special characters or numbers, must have space in between name.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 40],
        message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

var passwordValidator = [
    validate({
        validator: 'matches',
        arguments: /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,35}$/,
        message: 'Password needs to have at least one lower case, one uppercase, one number, one special character, and must be at least 8 characters but no more than 35.'
    }),
    validate({
        validator: 'isLength',
        arguments: [8, 35],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

var mobileValidator = [
    validate({
        validator: 'matches',
        arguments: /^((\+)?(\d{2}[-]))?(\d{10}){1}?$/,
        message: 'Mobile number must be 10 digits.'
    }),
    validate({
        validator: 'isLength',
        arguments: [10, 15],
        message: 'Mobile number should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];


var UserSchema = new Schema({

    name : { type: String, required: true, validate: nameValidator },
    email : { type: String, required: true, lowercase:true, unique: true, validate: emailValidator },
    mobile : { type: String },
    gender : { type: String },
    password : { type: String, select: false },
    address : { type: String },
});

UserSchema.plugin(titlize, {
    paths: ['name']
});

UserSchema.plugin(titlize, {
    paths: ['address']
});

UserSchema.pre('save', function(next) {
    var user = this;
    
    if (!user.isModified('password')) return next();
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if (err) return next(err); 
        user.password = hash; 
        next(); 
    });
});

UserSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password); 
};

module.exports = mongoose.model('SimpleUser', UserSchema);
