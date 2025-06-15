

//  here we are creating a wrapper 


// const asyncHandler = (requestHandler) => async (req , res , next)=>{
//     try{

//     return  await requestHandler(req , res , next)

//     }
//     catch(error){
//         res.status(error.code || 500),
//         res.json({
//             success : false,
//             message : error.message,
//         })
//     }
// }  // this is try catch method but we will see promise method also 

// ok now i got now why we use this asyncHabdler function basically we are creating a wrapper for the try and catch method instead of writting several times for try and catch we are creating a wraper of it 




const asyncHandler = (requestHandler) =>{
   return ( req , res , next) =>{
        Promise.resolve(requestHandler(req , res , next))
        .catch((err) => next(err));
    }
}

export {asyncHandler};