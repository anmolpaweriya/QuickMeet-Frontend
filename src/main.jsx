import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'




// content Providers
import { ToastifyProvider } from './Components/Toastify/Toastify.jsx'
import { LoadingProvider } from './Components/PreLoader/PreLoader.jsx'
import UserDetailsProvider from './CustomHooks/useUserDetails.jsx'
import APIProvider from './CustomHooks/useGetAPI.jsx'
import SocketProvider from './CustomHooks/useSocket.jsx'




ReactDOM.createRoot(document.getElementById('root')).render(

  <LoadingProvider>
    <ToastifyProvider position='right-bottom'>
      <APIProvider>
        <UserDetailsProvider>
          <SocketProvider>






            <App />





          </SocketProvider>
        </UserDetailsProvider>
      </APIProvider>
    </ToastifyProvider>
  </LoadingProvider>
)
