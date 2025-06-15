import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {publishVideo , getVideoById , updateVideoDetails , deleteVideo , togglePublishStatus , getAllVideos} from "../controllers/videos.controller.js"



// apply JWTverify to all the routes 
const router = Router();


router.use(verifyJWT);

router.route("/publishVideo").post(upload.fields([
    {
        name : "videoFile",
        maxCount : 1,
    },
    {
        name : "thumbnail",
        maxCount : 1,
    }
]),
  publishVideo

);

router.route("/videoId/:videoId").get(getVideoById);

router.route("/updateVideoDet/:videoId").patch( upload.single("thumbnail") , updateVideoDetails)

router.route("/videoDelete/:videoId").delete(deleteVideo)

router.route("/toggleStatus/:videoId").patch(togglePublishStatus);

router.route("/getAllVideos/").get(getAllVideos);

export default router