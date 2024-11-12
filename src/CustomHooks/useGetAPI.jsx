import React, { useContext } from "react";


// content api
const APIContext = React.createContext();





// functions

export function useGetAPI() { return useContext(APIContext) }

export default function APIProvider({ children }) {


    // const api = "http://localhost:8000"
    // const api = "https://apmeetserver.glitch.me"
    const api = "https://quickmeet.publicvm.com"


    return <APIContext.Provider value={api}>
        {children}
    </APIContext.Provider>
}