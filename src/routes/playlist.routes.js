import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {createPlaylist , addVideoToPlaylist , removeVideoFromPlaylist , updatePlayList , getPlaylistById , deletePlaylist , getUserPlaylist} from "../controllers/playlist.controller.js"
const router = Router();

router.use(verifyJWT) // the middleware is applied for all routes

router.route("/createPlaylist").post(createPlaylist);

router.route("/addvideos/:playListId/:videoId").patch(addVideoToPlaylist);

router.route("/removevideo/:playListId/:videoId").patch(removeVideoFromPlaylist);

router.route("/updateplaylist/:playListId").patch(updatePlayList);

router.route("/getPlaylistById/:playListId").get(getPlaylistById);

router.route("/deletePlaylist/:playListId").delete(deletePlaylist);

router.route("/usersplaylist/:userId").get(getUserPlaylist);

export default router;

