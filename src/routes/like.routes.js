import { Router } from "express";
import {toggleVideoLike , toggleCommentLike , toggleTweetLike ,getDetailsOfOwnerAndVideoDetailsForVideo , getLikedVideos , getLikedTweets , getLikedComments} from "../controllers/like.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggleVideoLike/:videoId").post(toggleVideoLike);

router.route("/toggleCommentLike/:commentId").post(toggleCommentLike);

router.route("/toggleTweetLike/:tweetId").post(toggleTweetLike);

router.route("/getdetails/:likedId").get(getDetailsOfOwnerAndVideoDetailsForVideo);

router.route("/getLikedVideos/:user").get(getLikedVideos);

router.route("/getLikedTweets/:user").get(getLikedTweets);

router.route("/getLikedComments/:user").get(getLikedComments);




export default router;