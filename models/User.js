const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const HourSchema = new mongoose.Schema({
    hour:{type:Number},
    kicks:{type:Number},
}, { _id : false });

const DaySchema = new mongoose.Schema({
    day:{type:Number},
    hours:[HourSchema],
}, { _id : false });

const MonthSchema = new mongoose.Schema({
    month:{type:Number},
    days:[DaySchema]    
}, { _id : false });

const YearSchema = new mongoose.Schema({
    year:{type:Number},
    months:[MonthSchema]
});

const UserSchema = new mongoose.Schema({
    first:{
        type:String,
        default:"",
    },
    last:{
        type:String,
        default:"",
    },
    email:{type:String,
    required:[true, 'Please provide an email.'],
    match:[
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide a valid email.'
        ],
    unique:true,
    },
    password:{
        type:String,
        required:[true, 'Please provide a password.'],
        minlength:[5, 'Password must be at least 5 characters'],
    },
    years:[YearSchema]
});

UserSchema.pre('save', async function(){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.pre('findOneAndUpdate', function(next){
    this.options.runValidators = true;
    next();
});

UserSchema.methods.getEmail = function(){
    return this.email
}

UserSchema.methods.createJWT = function(){
    return jwt.sign({userID:this._id, username:this.username}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_LIFETIME})
}

UserSchema.methods.comparePassword = async function(candidatePassword){
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

const User = mongoose.model('User', UserSchema);
const Year = mongoose.model('Year', YearSchema);
const Month = mongoose.model('Month', MonthSchema);
const Day = mongoose.model('Day', DaySchema);
const Hour = mongoose.model('Hour', HourSchema);


module.exports = 
{
    User, Year, Month, Day, Hour, 
}