import liff from "@line/liff";
import React, { useEffect } from "react";


const Line = () =>{
    useEffect(()=>{
        liff.init({liffId:'2006592847-7XwNn0YG'})
        .then(()=>{
            handleLogin()

        });
         },[])

         const handleLogin = async()=>{
            try{
                const profile = await liff.getProfile()
                console.log(profile)

            }catch(err){
                console.log(err)
            }

         }

    return(
        <div>
            Line
        </div>

    )

}

export default Line;