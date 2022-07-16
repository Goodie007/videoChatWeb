import React, { useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';


 const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc'})

 const VideoCall = () => {
    return (
        <div>
            <div>hello</div>
        </div>
    )
 }

 export { VideoCall }
