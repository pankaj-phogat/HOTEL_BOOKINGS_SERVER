
//req.user
import User from '../models/users';
const Stripe= require('stripe');
const stripe=Stripe(process.env.STRIPE_SECRET);
import queryString from 'query-string';
import Hotel from '../models/hotel';
import Order from '../models/order';

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

export const stripeSessionId= async (req,res) => {
    //console.log('YOU HIT STRIPE SESSION ID',req.body.hotelId);
    try{
        //1. get hotel id from req.body
        const { hotelId }=req.body;
        //2. find the hotel based on hotelId from req.body
        const item=await Hotel.findById(hotelId).populate('postedBy').exec();
        //3. 20% charge as application fee (by our platform)
        const fee=(item.price*20)/100;
        //4. create a session
        const session=await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            //5. purchasing item details, it will be shown to user on checkout
            line_items: [{
              name:item.title,
              amount: item.price*100,//stripe recieves in cents
              currency: 'inr',
              quantity: 1,
            }],
            //6. create payment intent with application fee and destination charge
            payment_intent_data: {
              application_fee_amount: fee*100,
              //this seller can see his balance in frontend dashboard
              transfer_data: {
                destination: item.postedBy.stripe_account_id,
              },
            },
            mode: 'payment',
            success_url: `${process.env.STRIPE_SUCCESS_URL}/${item._id}`,
            cancel_url: process.env.STRIPE_CANCEL_URL,
          });
        //7. add this session object to user in database
        await User.findByIdAndUpdate(req.user._id,{ stripeSession : session}).exec();
        //8. send session id as response to frontend so that it can make connection
        console.log("SESSION ====>",session);
        res.send({
            sessionId : session.id
        })

    }catch(err){
        console.log(err);
    }
}


export const stripeSuccess= async (req,res) => {
    try{
        //1. get hotelId from req.body
        const hotelId=req.body.hotelId;
        //2. find currently logged in user
        const user= await User.findById(req.user._id).exec();
        //check if user has stripe session
        if(!user.stripeSession) return ;
        //3. reterive stripe session based on sessionId we previsously saved on used database
        const session= await stripe.checkout.sessions.retrieve(user.stripeSession.id);
        //4. check if session payment status is paid, YES==> create order
        if(session.payment_status==='paid'){
            // 5. check if order with that session id already exists, by querying orders collection
            const orderExist=await Order.findOne({"session.id" : session.id}).exec();
            if(orderExist){
                //6. if order exist send success-->true
                res.json({ success : true});
            }else{
                //7. create new order and send success true
                const newOrder=await new Order({
                    hotel : hotelId,
                    session,
                    orderedBy : user._id
                }).save();

                //8. remove user session
                // *** $set changes only particular fields 
                // without it whole object is set to whatever is provided
                await User.findByIdAndUpdate(user._id,{
                    $set :  {
                        stripeSession : {}
                    }
                }).exec();

                res.json({success : true});
            }
        }
    }catch(err){
        console.log('stripe success error',err);
    }

}