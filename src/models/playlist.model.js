import mongoose, {model, Schema} from "mongoose";

const playListSchema = new Schema(
    
    {
        name : {
            type : String,
            required : true,
        },
        description : {
            type : String,
            required : true,
        },
        videos : [
        {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video"
        }
       ],

       owner : {
          type : mongoose.Schema.Types.ObjectId,
          ref : "User",
       }

    } , 
    
    
    {timestamps : true}

)

const Playlist = model("Playlist" , playListSchema);

export{Playlist};