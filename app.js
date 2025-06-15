import express from "express";

import cookieParser from "cookie-parser";
import cors from "cors";

const app =  express();

// we are configuring the cors file 


app.use(cors(
  {
    origin :  process.env.CORS_ORIGIN, // here we are defining the origin which is frontend's url's 
    credentials : true,
  }
))

app.use(express.json()); // here we are saying the that some the data comes in json format so please handle it 
app.use(express.urlencoded({extended : true})); // here urlencoded means , some the data comes from the url , for example the hitesh choudary when we type and enter this there will be some data from the url and for accessing this data we use urlencoded 
app.use(express.static("public"));

app.use(cookieParser()); // this cookie-parser is used for handling the cookies in server side 



// here we are importing all the routes 

import router from "./src/routes/user.routes.js";

import tweetRouter from "./src/routes/tweet.routes.js"

import videoRouter from "./src/routes/video.routes.js";

import commentRouter from "./src/routes/comment.routes.js";

import likeRouter from "./src/routes/like.routes.js";

import subscriptionRouter from "./src/routes/subscription.routes.js"

import playlistRouter from "./src/routes/playlist.routes.js"

import healthcheckRoutes from "./src/routes/healthcheck.routes.js";

import dashboardRoutes from "./src/routes/dashboard.routes.js"

app.use("/api/v1/users" , router);

app.use("/api/v1/tweets", tweetRouter)

app.use("/api/v1/videos" , videoRouter);

app.use("/api/v1/comments" , commentRouter);

app.use("/api/v1/likes" , likeRouter);

app.use("/api/v1/subscription" , subscriptionRouter);

app.use("/api/v1/playlist" , playlistRouter);

app.use("/api/v1/healthcheck" , healthcheckRoutes);

app.use("/api/v1/dashboard", dashboardRoutes);
export {app};


// if we want to use the multiple cors or a dynamic originn for origin then we use array type method 

// const whiteListed = ["http://localhost:3000" , "http://localhost:4000"];
// app.use(cors({
//   origin : function(origin , callback){
//       if(whiteListed.indexOf(origin) !== -1){
//         callback(null , true)
//       } else {
//         callback( new Error ("Not allowd by cors"));
//       }
//   }
// }))

// this is the way of handling dynamic cors handling 


