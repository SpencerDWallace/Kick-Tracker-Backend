const {User, Year, Month, Day, Hour} = require('../models/User')
// const {StatusCodes} = require('http-status-codes')
// const { BadRequestError, UnauthenticatedError } =  require('../errors')
const {passwordReset, ResetPassword, saltPW} = require('./utility')

const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August',  'September', 'October', 'November', 'December']


const register = async (req, res) =>{
    const {email, password} = req.body
    if(!email || !password){
        res.send('Please enter an email and password.')
    }
    else{
        const checkEmail = await User.findOne({email})
        if(checkEmail){
            res.send('Email exists with another account.')
        }
        else{
            const user = await User.create({email, password})
            .then(function(user){
                console.log('user created', user)
                
                const token = user.createJWT()
                res.json({ token, user, success:true })
            })
            .catch(function(err){
                console.log(err)
                if(err && err.errors){
                if(err.errors.email)
                    res.send(err.errors.email.message)
                else if(err.errors.password)
                    res.send(err.errors.password.message)
                }
                else{
                    res.send('Something went wrong.')
                }
                
            })
        }
    }
}


const login = async (req, res) =>{
    const {email, password} = req.body
    
    if(!email || !password){
        res.send('Please enter an email and password.')
    }
    else{
        const user = await User.findOne({email})
        if(!user){
            res.send('Invalid Credentials.')
        }
        // else if(!user.valid)
        //     res.send('Please finish registering or contact IT support.')
        else{
            console.log(password)
            const isPasswordCorrect = await user.comparePassword(password)
            if(!isPasswordCorrect){
                res.send('Wrong Password.')
            }
            else{
                const oldReset = await ResetPassword.findOne({email:email})
                if(oldReset){
                    await ResetPassword.deleteOne({email:oldReset.email, _id:oldReset._id})
                }
                //console.log(`Email is: ${email} | Password is ${password}`)
                const token = user.createJWT()
                res.json({ token, email:user.getEmail(), success:true })
            }
        }
    }
}

const getUser = async (req, res) =>{
    const userID = req.user.userID
    if(userID){
        const user = await User.findById({_id:userID});
        res.json({firstName:user.first, lastName:user.last, email:user.email, success:true})
    }
    else{
        res.send('Invalid Credentials.')
    }
}

const resetUserPassword = async (req, res) =>{
    const {email:userEmail, url:resetURL} = req.body
    console.log(userEmail, resetURL)
    if(userEmail, resetURL){
        const user = await User.findOne({email:userEmail});
        if(user){
            const OldReset = await ResetPassword.findOne({email:user.email})
            if(OldReset){
                await ResetPassword.deleteOne({email:OldReset.email, _id:OldReset._id})
                console.log(OldReset)
            }
            const resetID = await ResetPassword.create({email:user.email})
            console.log(resetID)
            passwordReset(resetID.email, resetID._id, resetURL)
            res.json({reset:true, success:true})
        }
        else{
                res.send('Email is not registered.')
        }
        
    }
    else{
        res.send('Invalid Email.')
    }

}

const newUserPassword = async (req, res) =>{
    const { body:{email, password}, params:{id:resetID} } = req
    if(email, password){
        const reset = await ResetPassword.findOne({email:email, _id:resetID})
        if(reset)
        {   
            const user = await User.findOne({email:email})
            .then(async function(user){
                user.password = password;
                await user.save().then(async function(){
                    console.log('User password reset.', user)
                    await ResetPassword.deleteOne({email:email, _id:resetID})
                    res.json({reset:true, success:true})    
                })
                .catch(function(err){
                    //console.log(err)
                    console.log(err)
                    if(err && err.errors){
                    if(err.errors.email)
                        res.send(err.errors.email.message)
                    else if(err.errors.password)
                        res.send(err.errors.password.message)
                    }
                    else{
                        res.send('Something went wrong.')
                    }
                    
                })
            })
            .catch(function(err){
                //console.log(err)
                console.log(err)
                if(err && err.errors){
                if(err.errors.email)
                    res.send(err.errors.email.message)
                else if(err.errors.password)
                    res.send(err.errors.password.message)
                }
                else{
                    res.send('Something went wrong.')
                }
                
            })
        }
        else{
            res.send('Invalid.')
        }
    }
    else{
        res.send('Email and password required.')
    }
}

const saveKicks = async(user, res) =>{
    await User.findOneAndUpdate({_id:user._id}, {years:user.years})
    .then(function(){
        console.log('Kicks updated.')
        return res.json({success:true, user:user});
    })
    .catch((err)=>{
        console.error(err)
        return res.json({success:false, msg:'Error updating data. Please try again.'})
    })
}

const changeKicks = async (req, res) =>{
    let { body:{year, month, day, hour, kicks}} = req;
    if(year === undefined || month === undefined || day === undefined || hour === undefined || kicks === undefined){
        res.send('Invalid. Missing data');
        return;
    }

    year = Number(year); month = Number(month); day = Number(day); hour = Number(hour); kicks = Number(kicks);
    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }

    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === year){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === month){
                    for(let d = 0; d < user.years[y].months[m].days.length; d++){
                        if(user.years[y].months[m].days[d].day === day){
                            for(let h = 0; h < user.years[y].months[m].days[d].hours.length; h++){
                                if(user.years[y].months[m].days[d].hours[h].hour === hour){
                                    user.years[y].months[m].days[d].hours[h].kicks = kicks;
                                    return saveKicks(user, res);
                                }
                            }
                            const newHour = new Hour({hour:hour, kicks:kicks});
                            user.years[y].months[m].days[d].hours.push(newHour);
                            return saveKicks(user, res);
                        }
                    }
                    const newHour = new Hour({hour:hour, kicks:kicks});
                    const newDay = new Day({day:day, hours:newHour})
                    user.years[y].months[m].days.push(newDay);
                    return saveKicks(user, res);
                }
            }
            const newHour = new Hour({hour:hour, kicks:kicks});
            const newDay = new Day({day:day, hours:newHour})
            const newMonth = new Month({month:month, days:newDay})
            user.years[y].months.push(newMonth);
            return saveKicks(user, res);
        }
    }

    //no return reached in nested for loop, completely new document
    const newHour = new Hour({hour:hour, kicks:kicks});
    const newDay = new Day({day:day, hours:newHour})
    const newMonth = new Month({month:month, days:newDay})
    const newYear = new Year({year:year, months:newMonth})
    user.years.push(newYear);
    return saveKicks(user, res);
}

const kicksByMonth = async (req, res) =>{
    let { query:{year, month}} = req;
    if(year === undefined || month === undefined){
        res.send('Invalid. Missing data');
        return;
    }
    year = Number(year); month = Number(month);

    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }

    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === year){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === month){
                    res.json({success:true, msg:"Kicks found!", data:user.years[y].months[m]});
                    return;
                }
            }
        }
    }

    res.json({success:false, msg:"No kicks saved for this month."});
    return;
}

const kicksByDay = async (req, res) =>{
    let { query:{year, month, day}} = req;
    if(year === undefined || month === undefined || day === undefined){
        res.send('Invalid. Missing data');
        return;
    }
    year = Number(year); month = Number(month); day = Number(day);

    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }

    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === Number(year)){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === Number(month)){
                    for(let d = 0; d < user.years[y].months[m].days.length; d++){
                        if(user.years[y].months[m].days[d].day === Number(day)){
                            res.json({success:true, msg:"Kicks found!", data:user.years[y].months[m].days[d]});
                            return;
                        }
                    }
                }
            }
        }
    }
    res.json({success:false, msg:"No kicks saved for this day."});
    return;
}


const kicksByHour = async (req, res) =>{
    let { query:{year, month, day, hour}} = req;
    if(year === undefined || month === undefined || day === undefined || hour === undefined){
        res.send('Invalid. Missing data');
        return;
    }
    year = Number(year); month = Number(month); day = Number(day); hour = Number(hour);

    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }

    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === year){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === month){
                    for(let d = 0; d < user.years[y].months[m].days.length; d++){
                        if(user.years[y].months[m].days[d].day === day){
                            for(let h = 0; h < user.years[y].months[m].days[d].hours.length; h++){
                                if(user.years[y].months[m].days[d].hours[h].hour === hour){
                                    res.json({success:true, msg:"Kicks found!", data:user.years[y].months[m].days[d].hours[h]});
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    res.json({success:false, msg:"No kicks saved for this hour."});
    return;
}

const validDaysOfMonth = async (req, res) =>{
    let { query:{year, month}} = req;
    if(year === undefined || month === undefined){
        res.send('Invalid. Missing data');
        return;
    }
    year = Number(year); month = Number(month);

    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }
    
    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === year){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === month){

                    let validDays = []
                    for(let d = 0; d < user.years[y].months[m].days.length; d++){

                        let kicksTotal = 0;
                        for(let h = 0; user.years[y].months[m].days[d].hours.length; h++){
                            if(user.years[y].months[m].days[d].hours[h] === undefined || user.years[y].months[m].days[d].hours[h].kicks === undefined)
                                continue;
                            kicksTotal += user.years[y].months[m].days[d].hours[h].kicks;
                        }

                        if(kicksTotal === 0)
                            continue;

                        let formattedDay = months[month] + " " + user.years[y].months[m].days[d].day + ", " + year
                        validDays.push(formattedDay);
                    }
                    if(validDays.length >= 1)
                        res.json({success:true, msg:`Days for ${months[month]} ${year} found!`, data:validDays});
                    else
                        res.json({success:false, msg:`No days found for ${months[month]} ${year} found!`});
                    return;
                }
            }
        }
    }
    res.json({success:false, msg:`Days for ${months[month]} ${year} could not be found.`});
    return;
}

const updateDay = async (req, res) =>{
    let { body:{year, month, day}} = req;
    if(year === undefined || month === undefined || day === undefined || day.hours === undefined){
        res.send('Invalid. Missing data');
        return;
    }
    year = Number(year); month = Number(month); day;

    const user = await User.findById({_id:req.user.userID})
    if(!user){
        res.send('Invalid. User not found.');
        return;
    }

    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === Number(year)){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === Number(month)){
                    for(let d = 0; d < user.years[y].months[m].days.length; d++){
                        if(user.years[y].months[m].days[d].day === day.day){
                            user.years[y].months[m].days[d] = day;
                            await User.findOneAndUpdate({_id:user._id}, {years:user.years})
                            res.json({success:true, msg:`${months[month]} ${day.day} ${year} updated!`, data:user.years[y].months[m].days[d]});
                            return;
                        }
                    }
                }
            }
        }
    }

    //no matching document found, treat as if new request - may be new month or new year
    for(let y = 0; y < user.years.length; y++){
        if(user.years[y].year === year){
            for(let m = 0; m < user.years[y].months.length; m++){
                if(user.years[y].months[m].month === month){ //matching month exists but no day present for the day provided
                    user.years[y].months[m].days.push(day);
                    await User.findOneAndUpdate({_id:user._id}, {years:user.years})
                    res.json({success:true, msg:`${months[month]} ${day.day} ${year} updated!`, data:user.years[y].months[m].days[0]});
                    return;
                }
            } 
            //year exists but no matching month
            const newMonth = new Month({month:month, days:day})
            user.years[y].months.push(newMonth);
            return saveKicks(user, res);
        }
    }

    //no matching year found, new year provided
    const newMonth = new Month({month:month, days:day})
    const newYear = new Year({year:year, months:newMonth})
    user.years.push(newYear);
    return saveKicks(user, res);
}

module.exports = {
    register, 
    login,
    getUser,
    resetUserPassword,
    newUserPassword,
    changeKicks,
    kicksByMonth,
    kicksByDay,
    kicksByHour,
    validDaysOfMonth, 
    updateDay
}