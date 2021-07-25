
//req.user
import User from '../models/users';
const Stripe= require('stripe');
const stripe=Stripe(process.env.STRIPE_SECRET);
import queryString from 'query-string';

export const createConnectAccount=async (req,res) => {
    // 1. find user from db
    const user =await User.findById(req.user._id);
    console.log('USER',user);
    // 2. if user don't have stripe account id , create one
    // need to save this very first time
    // otherwise it will be created again if process was left in between
    if(!user.stripe_account_id){
        const account=await stripe.accounts.create({
            type : "standard"
        });
        console.log('ACCOUNT ===> ',account.id);
        user.stripe_account_id=account.id;
        user.save();
    }
    // 3. create login link based on account if (for frontened to complete boarding)
    let accountLink=await stripe.accountLinks.create({
        account : user.stripe_account_id,
        refresh_url: process.env.STRIPE_REDIRECT_URL,
        return_url: process.env.STRIPE_REDIRECT_URL,
        type: 'account_onboarding'
    })
    //prefill any user info such as email
    accountLink=Object.assign(accountLink,{
        "stripe_user[email]":user.email || undefined
    })
    //console.log(accountLink);
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
    let link=`${accountLink.url}?${queryString.stringify(accountLink)}`;
    console.log('LOGIN LINK' , link);
    // 4. update payment schedule (optional. default is 2 days)
}

export const updateDelayDays=async (accountId) => {
    const account=stripe.accounts.update(accountId,{
        settings : {
            payouts : {
                schedule : {
                    delay_days : 10
                }
            }
        }
    });
    return account;
} 

export const getAccountStatus= async (req,res) => {
    //console.log('GET ACCOUNT STATUS');
    const user =await User.findById(req.user._id);
    const account= await stripe.accounts.retrieve(user.stripe_account_id);
    //console.log('USER ACCOUNT RETRIVED',account);
    //update account delay
    //only using express account not stndard, const updatedAccount=await updateDelayDays(account.id);
    const updatedUser= await User.findByIdAndUpdate(user._id, {
        stripe_seller : account
    },{ new : true })
    .select("-password")//to get updated user back, select everything except password
    .exec();
    //console.log('USER : ' , updatedUser); 
    res.status(200).json(updatedUser);
}

export const getAccountBalance= async (req,res) => {
    const user=await User.findById(req.user._id).exec();

    try{
        const balance=await stripe.balance.retrieve({
            stripeAccount : user.stripe_account_id
        });
        //console.log('STRIPE ACCOUNT BALANCE ===> ',balance);
        res.json(balance);
    }catch(err){
        console.log(err);
    }
}

export const payoutSetting=async (req,res) => {
    try{
        const user=await User.findById(req.user._id).exec();
        const loginLink=await stripe.accounts.createLoginLink(user.stripe_account_id,{
            redirect_url : process.env.STRIPE_SETTING_REDIRECT_URL
        });
        console.log('PAYOUT SETTINGS LOGIN LINK');
        res.json(loginLink);
    }catch(err){
        console.log('STRIPE PAYOUT SETTING ERROR ===> ',err);
        res.send('PAYOUT SETTINGS NOT SUPPORTED FOR STANDARD ACCOUNT');
    }
}