import { Router } from "express";
import {createTweet , getUserTweets , updateTweet , deleteTweet , getSpecificTweet} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verifyJWT); // Apply verifyJwt to all the routes in this file

router.route("/createTweet").post(createTweet);

router.route("/user/:userId").get(getUserTweets);

router.route("/tweetupdate/:tweetId").patch(updateTweet);

router.route("/tweetdel/:tweetId").delete(deleteTweet);

router.route("/tweetspecific/:tweetId").get(getSpecificTweet);


export default router;

