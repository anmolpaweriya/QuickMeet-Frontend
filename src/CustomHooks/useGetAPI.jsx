import React, { useContext } from "react";


// content api
const APIContext = React.createContext();





// functions

export function useGetAPI() { return useContext(APIContext) }

export default function APIProvider({ children }) {


    // const api = "http://localhost:8000"
    // const api = "https://apmeetserver.glitch.me"
    const api = "http://ec2-13-201-129-30.ap-south-1.compute.amazonaws.com:3001"


    return <APIContext.Provider value={api}>
        {children}
    </APIContext.Provider>
}