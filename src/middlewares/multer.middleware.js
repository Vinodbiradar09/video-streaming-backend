// now we will write how to upload files using multer 

import multer from "multer";
import crypto from "crypto";
import path from "path";


const storage = multer.diskStorage({
    destination : (req , file , cb) =>{
        cb(null , "./public/temp")
    },
    filename : (req , file , cb)=>{
        // crypto.randomBytes(12 , (err , bytes) =>{
        //     const uniqueFileName = bytes.toString("hex") + path.extname(file.originalname);
        //     console.log("unique" , uniqueFileName);
        //     cb(null , uniqueFileName)
        // })

        const uniqueFileName = file.originalname;
        cb(null , uniqueFileName);

    }
})

export  const upload = multer ({storage : storage});

// this is a middleware for multer , we are using diskstorage here in object there are the options destination from were to access the video so it consist three req , file , cb 
// cb is null , and the filepath from were to access it
//  we are using crypto for randombytes genration , becoz not to overwrite the filenames

// /Users/vinodbiradar/Desktop/chai-aur-backend/public/temp/d310a5dc391f5aeba030f352.jpeg



