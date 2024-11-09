import CreateMeet from "./Components/CreateMeet/CreateMeet";
import MeetingPage from "./Components/MeetingPage/MeetingPage";




export default function App() {


  const roomId = new URLSearchParams(window.location.search).get('room')


  if (roomId)
    return <MeetingPage
      roomId={roomId}
    />

  return (
    <>
      <CreateMeet />

    </>
  )
}


