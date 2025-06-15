import { Router } from "express";
import {addComent , updateComment , deleteComment , getDetailsOfUserAndVideoWhichHeWasCommented , findCommentById , findAllTheCommentsMadeByUser , getVideoCommentsAll} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


router.use(verifyJWT); // apply jwt to all the routes

router.route("/create/:videoId").post(addComent);

router.route("/update/:commentId").patch(updateComment);

router.route("/delete/:commentId").delete(deleteComment);

router.route("/getdetails/:commentId").get(getDetailsOfUserAndVideoWhichHeWasCommented);

router.route("/getcommentById/:commentId").get(findCommentById);

router.route("/getAllCommentsByUser/:usersId").get(findAllTheCommentsMadeByUser); // make sure the name in /: id must be same as the what we destructure 

router.route("/getVideoCommentsAll/:videoId").get(getVideoCommentsAll);
export default router;