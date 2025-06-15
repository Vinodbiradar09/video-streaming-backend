import {getChannelStats , getChannelVideos} from "../controllers/dashboard.controller.js";
import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // applied middleware for all routes;


router.route("/getchannelvideos/:channelId").get(getChannelVideos);

router.route("/getchannelstats").get(getChannelStats);
export default router;