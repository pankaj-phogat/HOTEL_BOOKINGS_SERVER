import express from 'express';

//middleware
import { requireSignIn } from '../middlewares';

//controllers
import { createConnectAccount, payoutSetting } from '../controllers/stripe';
import { getAccountStatus, getAccountBalance } from '../controllers/stripe';

const router =express.Router();
router.post('/create-connect-account',requireSignIn,createConnectAccount);
router.post('/get-account-status',requireSignIn,getAccountStatus);
router.post('/get-account-balance',requireSignIn,getAccountBalance);
router.post('/payout-setting',requireSignIn,payoutSetting)

module.exports=router;