import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {toggleSubscription , getUserChannelSubscribers , getSubscribedChannels} from "../controllers/subscription.controller.js"



const router = Router();

router.use(verifyJWT); // using jwt for all routes

router.route("/subscribeChannel/:channelId").post(toggleSubscription);

router.route("/getAllSubscribersOfChannel/:channelId").get(getUserChannelSubscribers);

router.route("/getChannelsUserSubs/:subscriberId").get(getSubscribedChannels);


export default router;
