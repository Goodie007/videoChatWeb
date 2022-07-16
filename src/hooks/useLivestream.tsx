import React, { useEffect, useState }  from 'react';
import AgoraRTC, {
    IAgoraRTCClient, 
    IAgoraRTCRemoteUser, 
    MicrophoneAudioTrackInitConfig,
    CameraVideoTrackInitConfig, 
    IMicrophoneAudioTrack, 
    ICameraVideoTrack, 
    ILocalVideoTrack, 
    ILocalAudioTrack 
} from 'agora-rtc-sdk-ng';
  
  


const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc'})



export default function useLivestream(client: IAgoraRTCClient | undefined) 
:
{
    localAudioTrack: ILocalAudioTrack | undefined,
    localVideoTrack: ILocalVideoTrack | undefined,
    joinState: boolean,
    leave: Function,
    join: Function,
    remoteUsers: IAgoraRTCRemoteUser[],
}

const [ localVideoTrack, setLocalVideoTrack ] = useState<ILocalVideoTrack | undefined>(undefined);
const [ localAudioTrack, setLocalAudioTrack ] = useState<ILocalAudioTrack | undefined>(undefined);

const [ joinState, setJoinState ] = useState(false);
const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

async function createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig, videoConfig?: CameraVideoTrackInitConfig)
: Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]> {
    const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, videoConfig);
    setLocalAudioTrack(microphoneTrack);
    setLocalVideoTrack(cameraTrack) 
    return [microphoneTrack, cameraTrack];
}

async function join(
    appid: string, 
    channel: string,
    token?: string,
    uid?: string | number | null
){
    if (!client){
        return
    }
    const [microphoneTrack, cameraTrack] = await createLocalTracks();

    await client.join(appid, channel, token || null);
    await client.publish([microphoneTrack, cameraTrack]);
    
    (window as any).client = client;
    (window as any).videoTrack = cameraTrack;

    setJoinState(true);
}

async function leave(){
    if(localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
    }
    if(localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
    }
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
}

useEffect(() => {
    if (!client) {
        return
    }
    setRemoteUsers(client.remoteUsers);

    const handleUserUnpublished = ( user: IAgoraRTCRemoteUser) => {
        setRemoteUsers(remoteUsers => Array.from(client.remoteUsers))
    }
    const handleUserPublished = async ( user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);
        setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserJoin = ( user: IAgoraRTCRemoteUser) => {
        setRemoteUsers( remoteUsers => Array.from(client.remoteUsers))
    }
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
        setRemoteUsers(remoteUsers => Array.from(client.remoteUsers))
    }

    client.on('user-published', handleUserPublished)
    client.on('user-unpublished', handleUserUnpublished)
    client.on('user-join', handleUserJoin)
    client.on('user-left', handleUserLeft)

    return () => {
        client.off('user-published', handleUserPublished)
        client.off('user-unpublished', handleUserUnpublished)
        client.off('user-join', handleUserJoin)
        client.off('user-left', handleUserLeft)
    }
}, [client]);

return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join, 
    remoteUsers
}

)

