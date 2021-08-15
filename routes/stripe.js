import express from 'express';

//middleware
import { requireSignIn } from '../middlewares';

//controllers
import { createConnectAccount, payoutSetting, stripeSessionId, stripeSuccess } from '../controllers/stripe';
import { getAccountStatus, getAccountBalance } from '../controllers/stripe';

const router =express.Router();
router.post('/create-connect-account',requireSignIn,createConnectAccount);
router.post('/get-account-status',requireSignIn,getAccountStatus);
router.post('/get-account-balance',requireSignIn,getAccountBalance);
router.post('/payout-setting',requireSignIn,payoutSetting);
router.post('/stripe-session-id',requireSignIn,stripeSessionId);

router.post('/stripe-success',requireSignIn,stripeSuccess);

module.exports=router;