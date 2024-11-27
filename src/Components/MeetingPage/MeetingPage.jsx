import React, { useEffect, useRef, useState } from 'react'
import { Peer } from "peerjs";










// icons
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaCopy } from "react-icons/fa";
import { MdComputer, MdDraw, MdOutlineComputer } from "react-icons/md";
import { IoMdChatbubbles, IoMdClose } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";












// custom hooks
import { useSetUserDetials, useUserDetials } from '../../CustomHooks/useUserDetails';
import { useSocket } from '../../CustomHooks/useSocket';
import PreLoader, { useLoadingStart, useLoadingStop } from '../PreLoader/PreLoader';
import { useGetAPI } from '../../CustomHooks/useGetAPI';
import { usePushToastFunc } from '../Toastify/Toastify';













export default function MeetingPage({ roomId }) {





    // variables
    const mainVideoRef = useRef();
    const localStream = useRef();
    const usernameInputRef = useRef();
    const chatInputRef = useRef();
    const peer = useRef();
    const [chatSectionToggle, setChatSectionToggle] = useState(false)
    const [chatList, setChatList] = useState([])
    const [enabledMedia, setEnabledMedia] = useState({ video: false, audio: false, screenShare: false })
    const [usersList, setUsersList] = useState([])
    const [selectedMainStream, setSelectedMainStream] = useState({})



    // const peerOptions = {
    //     iceServers: [
    //         {
    //             urls: "stun:stun.relay.metered.ca:80",
    //         },
    //         {
    //             urls: "turn:global.relay.metered.ca:80",
    //             username: "2ad699eea1f2f61b1f11958b",
    //             credential: "5tcqmBTXblTRGu/p",
    //         },
    //         {
    //             urls: "turn:global.relay.metered.ca:80?transport=tcp",
    //             username: "2ad699eea1f2f61b1f11958b",
    //             credential: "5tcqmBTXblTRGu/p",
    //         },
    //         {
    //             urls: "turn:global.relay.metered.ca:443",
    //             username: "2ad699eea1f2f61b1f11958b",
    //             credential: "5tcqmBTXblTRGu/p",
    //         },
    //         {
    //             urls: "turns:global.relay.metered.ca:443?transport=tcp",
    //             username: "2ad699eea1f2f61b1f11958b",
    //             credential: "5tcqmBTXblTRGu/p",
    //         },
    //     ]
    // }

    const peerOptions = {
        host: "peerjs.publicvm.com",
        port: 443,
        key: "p33r",
        secure: true
    }










    // custom hooks
    const userDetails = useUserDetials();
    const setUserDetials = useSetUserDetials();
    const socket = useSocket();
    const loadingStart = useLoadingStart();
    const loadingStop = useLoadingStop();
    const api = useGetAPI();
    const pushToastFunc = usePushToastFunc();











    // functions 


    function _(el) { return document.querySelector(el) }

    async function reloadLocalStream() {

        if ((!enabledMedia.video || !enabledMedia.screenShare) && localStream.current)
            localStream.current.getVideoTracks()[0]?.stop()
        if (!enabledMedia.audio && localStream.current)
            localStream.current.getAudioTracks()[0]?.stop()
        if ((enabledMedia.audio || enabledMedia.video || enabledMedia.screenShare) && localStream.current)
            localStream.current.getTracks()?.forEach(track => track?.stop())



        if (!enabledMedia.audio && !enabledMedia.video && !enabledMedia.screenShare) {

            if (selectedMainStream.userId == socket.id)
                mainVideoRef.current.srcObject = null;
            else if (_(`#id-${socket.id} video`))
                _(`#id-${socket.id} video`).srcObject = null;

            localStream.current = null;
            socket.emit('stream-close', roomId)
            return;
        }



        if (!enabledMedia.screenShare)
            localStream.current = await navigator.mediaDevices.getUserMedia(enabledMedia)
        else
            localStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: enabledMedia.audio })


        if (selectedMainStream.userId == socket.id)
            mainVideoRef.current.srcObject = localStream.current;
        else if (_(`#id-${socket.id} video`))
            _(`#id-${socket.id} video`).srcObject = localStream.current;

        // alst strore local stream to users list for re-render 
        setUsersList(preState => preState.map(e => {
            if (e.userId != socket.id) return e;
            return { ...e, stream: localStream.current }
        }))
        sendStreamToAllUsers()
    }

    function peerConnect() {
        peer.current = new Peer(socket.id, peerOptions);


        peer.current.on('open', id => {

            loadingStop('MeetingPage');
            socket.emit('join-room', roomId, userDetails.username, peer.current.id);     // JOIN SOCKET ROOM WITH  {roomId}
        })


        peer.current.on('call', call => {

            call.answer(localStream.current);
            call.on('stream', remoteStream => {
                appendStream(call.peer, remoteStream);
                console.log(remoteStream)
            })
        })
    }

    function sendStreamToAllUsers() {
        if (!localStream.current) return;

        usersList.forEach(user => {
            if (user.userId == socket.id) return;
            sendStreamToUser(user.userId)
        })
    }

    function sendStreamToUser(userId) {
        // console.log(localStream.current, userId)         // testing
        if (!localStream.current) return;
        peer.current.call(userId, localStream.current)
    }

    function appendStream(userId, stream) {

        setUsersList(preState => preState.map(e => {
            if (e.userId != userId) return e;
            return { ...e, stream }
        }))

        if (userId == selectedMainStream.userId)
            mainVideoRef.current.srcObject = stream
        else if (_(`#id-${userId} video`))
            _(`#id-${userId} video`).srcObject = stream;

    }

    function userJoined(userId, username) {
        setUsersList(preState => {
            const user = preState.find(e => e.userId == userId)
            if (!user)
                return [...preState, { userId, username }]
            return preState
        })
        socket.emit('connection-back', userId, userDetails.username)
        receiveMessage("", `${username} is connected`)

        if (localStream.current)
            setTimeout(() => {
                sendStreamToUser(userId)
            }, 3000);
        pushToastFunc({
            message: `${username} Connected`,
            theme: 'dark'
        })
    }

    function connectionBack(userId, username) {
        setUsersList(preState => {
            const user = preState.find(e => e.userId == userId)
            if (!user)
                return [...preState, { userId, username }]
            return preState
        })
        receiveMessage("", `${username} is connected`)
        pushToastFunc({
            message: `${username} Connected`,
            theme: 'dark'
        })
    }

    function streamClose(userId) {
        setSelectedMainStream(preState => {
            if (userId == preState.userId)
                mainVideoRef.current.srcObject = null
            else if (_(`#id-${userId} video`))
                _(`#id-${userId} video`).srcObject = null
            return preState
        })

    }

    function userDisconnected(userId) {

        setUsersList(preState => preState.filter(e => e.userId != userId))
        setSelectedMainStream(preState => {

            if (preState.userId == userId) {
                return { userId: socket.id, username: userDetails.username, stream: localStream.current }
            }
            return preState
        })
    }

    function receiveMessage(username, message) {
        setChatList(preState => [...preState, { username, message }])
    }




    /* View in fullscreen */
    function openFullscreen(elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    /* Close fullscreen */
    function closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }




    function toggleFullscreen(elem) {

        elem.classList.toggle('fullScreenVideo')
        if (
            elem.classList.contains('fullScreenVideo')
        ) {

            openFullscreen(elem)
        }
        else
            closeFullscreen()
    }









    // useeffect
    window.onbeforeunload = e => {

        socket.emit('user-disconnected', roomId);
        // socket.disconnect()

        // e.returnValue = 'onbeforeunload';
        // return 'onbeforeunload';
    }




    useEffect(() => {


        usersList.forEach(user => {

            if (user.userId == selectedMainStream.userId) {
                mainVideoRef.current.srcObject = ((user.stream == undefined) ? null : user.stream);
                return;
            }
            if (!_(`#id-${user.userId} video`)) return
            _(`#id-${user.userId} video`).srcObject = user.stream;


        })
    }, [usersList, selectedMainStream])




    useEffect(() => {
        if (!userDetails) return;




        reloadLocalStream();




        // only connect once
        if (socket.connected) return;

        socket.on('connect', () => {
            // console.log(socket.id)   // testing

            peerConnect();  // connect peer server
            setSelectedMainStream({ userId: socket.id, username: userDetails.username })
            setUsersList(preState => [...preState, { userId: socket.id, username: userDetails.username }])







            // listening events
            socket.on('userJoined', userJoined)
            socket.on('connectionBack', connectionBack)
            socket.on('streamClose', streamClose)
            socket.on('userDisconnected', userDisconnected)
            socket.on('receiveMessage', receiveMessage)

        })

        socket.connect();




    }, [enabledMedia, userDetails])




    return (<>
        <PreLoader
            id={"MeetingPage"}
        />



        {/* username model */}
        {!userDetails &&
            <form
                id='usernameModelForm'
                className='translate-x-[-50%] translate-y-[-80%] fixed z-10 grid p-4 glassy bg-white left-1/2 top-[50%] gap-4 transition-all duration-700'

            >
                <h1 className='text-black font-bold text-center text-xl'>Enter your name</h1>
                <input placeholder='Name' className='bg-transparent border-b-2  text-black outline-none p-2'
                    ref={usernameInputRef}
                    spellCheck={false}
                />
                <button
                    className='bg-blue-400 rounded-lg p-2 text-white font-bold'

                    onClick={e => {
                        e.preventDefault()
                        if (!usernameInputRef.current.value) {
                            usernameInputRef.current.focus()
                            return
                        }
                        _('#usernameModelForm').classList.add('top-[150%]')
                        _('#usernameModelForm').classList.remove('top-[50%]')
                        setTimeout(() => {

                            setUserDetials({ username: usernameInputRef.current.value })
                        }, 1000);
                    }

                    }
                >Join</button>
            </form>}


        {/* chat section  */}
        <div className={'fixed z-10 top-0 h-full w-[400px] glassy bg-[#33333399] grid grid-rows-[2em_auto_2em] p-2 box-border transition-all duration-500 ' +
            (chatSectionToggle ? ' right-0 ' : ' right-[-150%] ')}>
            <div className='flex justify-end p-2 text-2xl '>

                <button
                    onClick={e => setChatSectionToggle(false)}
                ><IoMdClose /></button>
            </div>


            <div className='h-full overflow-y-scroll flex gap-1 flex-col py-5 '>
                {/* chats list  */}
                {chatList.map((e, i) => {
                    return <div
                        key={i}
                        className='shrink-0 flex gap-2 items-center  '>
                        <span className='bg-black text-white font-bold p-2 rounded-lg'>{e.username}</span>
                        <p>{e.message}</p>
                    </div>
                })}
            </div>



            <form className='grid grid-cols-[auto_5em] overflow-hidden rounded-lg bg-white '>
                <input
                    spellCheck={false}
                    ref={chatInputRef}
                    className='bg-white text-black outline-none px-2 w-full' />
                <button className='bg-blue-500 text-black w-full rounded-lg'
                    onClick={e => {
                        e.preventDefault();
                        if (!chatInputRef.current.value.trim()) return;

                        socket.emit('send-message', roomId, userDetails.username, chatInputRef.current.value.trim())
                        receiveMessage('You', chatInputRef.current.value.trim())
                        chatInputRef.current.value = ""
                    }}
                >Send</button>
            </form>
        </div>





        {/* main page */}
        <div
            className='w-full h-[100svh] grid grid-rows-[90svh_10svh]'
        >

            <div className={' w-full h-full box-border grid justify-center items-center justify-self-center p-2 gap-2 transition-all duration-500  ' +
                (usersList.length > 1 ? " sm:grid-cols-[auto_220px]   max-sm:grid-rows-[auto_150px]" : " sm:grid-cols-[auto_0px] max-sm:grid-rows-[auto_0px] ")}>

                <div className='mainVideoDiv relative w-full flex justify-center items-center transition-all duration-500 h-full bg-[#333] rounded-lg overflow-hidden '>


                    <button
                        className='absolute right-4 top-2 text-2xl hover:scale-110 z-[1] transition-all rounded-lg p-1 bg-[#222] '
                        onClick={() => toggleFullscreen(_('.mainVideoDiv'))}
                    >
                        {
                            _('.mainVideoDiv')?.classList.contains('fullScreenVideo') ?
                                <AiOutlineFullscreenExit />
                                :
                                < AiOutlineFullscreen />
                        }
                    </button>

                    <h1
                        className='absolute left-10 bottom-10 text-2xl font-semibold'
                    >{selectedMainStream.username}</h1>

                    <video
                        controls={false}
                        ref={mainVideoRef}
                        autoPlay
                        className={'h-full transition-all duration-500 bg-[#333] rounded-lg  ' + (socket.id == selectedMainStream.userId ? ' object-cover ' : ' object-contain ')}

                    />

                </div>





                {/* users LIst  */}

                {
                    <div className='h-full w-full items-center  flex sm:flex-col  gap-3 overflow-y-scroll  py-3 max-sm:overflow-x-scroll'>
                        {usersList.map(user => {
                            if (user.userId != selectedMainStream.userId)
                                return <button
                                    onClick={() => setSelectedMainStream(user)}
                                    id={`id-${user.userId}`}
                                    className='relative w-[200px] h-[100px] shrink-0 bg-[#333]  overflow-hidden rounded-lg hover:scale-95 transition-all'
                                    key={user.userId}
                                >
                                    <span className='absolute z-1 top-2 left-2'>
                                        {user.username}
                                    </span>
                                    <video
                                        className='w-full h-full object-contain'
                                        autoPlay />
                                </button>
                        })}


                    </div>}





            </div>







            {/* controls */}
            <div className='w-full h-full flex justify-center items-center gap-5 text-2xl max-sm:text-xl transition-all max-sm:gap-2 '>
                <button
                    onClick={() => setEnabledMedia(preState => { return { ...preState, video: false, screenShare: !preState.screenShare } })}
                    className={'p-4 rounded-full max-sm:hidden ' +
                        (enabledMedia.screenShare ? " bg-blue-700 " : " bg-[#333] ")
                    }
                >
                    <MdComputer />
                </button>
                <button
                    onClick={() => setEnabledMedia(preState => { return { ...preState, video: !preState.video, screenShare: false } })}
                    className={'p-4 rounded-full ' +
                        (enabledMedia.video ? " bg-blue-700 " : " bg-[#333] ")
                    }
                >
                    {enabledMedia.video ?
                        <FaVideo /> : <FaVideoSlash />
                    }                </button>
                <button
                    onClick={() => setEnabledMedia(preState => { return { ...preState, audio: !preState.audio } })}


                    className={'p-4 rounded-full ' +
                        (enabledMedia.audio ? " bg-blue-700 " : " bg-[#333] ")
                    }>
                    {enabledMedia.audio ?
                        <FaMicrophone /> :
                        <FaMicrophoneSlash />
                    }
                </button>



                <a
                    href='/apDraw'
                    target="_blank"
                    className='bg-[#333] p-4 rounded-full'><MdDraw /></a>
                <button
                    onClick={e => {
                        e.target.classList.remove('bg-[#333]')
                        e.target.classList.add('bg-blue-700')

                        setTimeout(() => {
                            e.target.classList.remove('bg-blue-700')
                            e.target.classList.add('bg-[#333]')
                        }, 5000);

                        navigator.clipboard.writeText(window.location.href);

                        pushToastFunc({
                            message: "link Copied",
                            theme: 'dark'

                        })
                    }}
                    className='bg-[#333] p-4 rounded-full'><FaCopy /></button>
                <button
                    onClick={e => setChatSectionToggle(preState => !preState)}
                    className={' p-4 rounded-full ' + (chatSectionToggle ? " bg-blue-500 " : " bg-[#333] ")}><IoMdChatbubbles /></button>

                <button
                    onClick={() => {
                        socket.emit('user-disconnected', roomId);
                        window.location.href = window.location.origin + window.location.pathname
                    }}
                    className='bg-red-600 text-black p-4 rounded-full'><IoCall /></button>
            </div>
        </div>
    </>
    )
}
