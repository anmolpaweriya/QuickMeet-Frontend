import React, { useContext, useState } from "react";



// content api
const UserDetailsContext = React.createContext();
const SetUserDetailsContext = React.createContext();









// funcitons

export function useUserDetials() { return useContext(UserDetailsContext) }
export function useSetUserDetials() { return useContext(SetUserDetailsContext) }

export default function UserDetailsProvider({ children }) {

    const [userDetials, setUserDetials] = useState(null)




    return <UserDetailsContext.Provider value={userDetials}>
        <SetUserDetailsContext.Provider value={setUserDetials}>

            {children}
        </SetUserDetailsContext.Provider>
    </UserDetailsContext.Provider>
}