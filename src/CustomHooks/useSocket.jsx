import React, { useContext } from "react";
import { io } from 'socket.io-client'



// custom hooks
import { useGetAPI } from "./useGetAPI";


// content Socket
const SocketContext = React.createContext();





// functions

export function useSocket() { return useContext(SocketContext) }


export default function SocketProvider({ children }) {

    const api = useGetAPI();

    const socket = io(api, { autoConnect: false })


    return <SocketContext.Provider value={socket}>
        {children}
    </SocketContext.Provider>
}