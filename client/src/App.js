import React,{ useState, useEffect } from 'react';
import './App.css';
import './components/search'
import socketIOClient from 'socket.io-client';
import Search from './components/search';


function App() {

  const [socket, setSocket] = useState(socketIOClient("http://localhost:9005/"));
  const [playlist, setPlayList] = useState({});
  const [authCode, setAuthCode] = useState({});
  const [room, setRoom] = useState(window.location.href.replace(/.*\//, ''));
  
  useEffect(() => {
    socket.on('connect',  () => {
      console.log(window.location.href.replace(/.*\//, ''));
      socket.emit('subscribe', room);
    });
  
    socket.on('sendToken', (data) => {
        console.log(data);
        setAuthCode(data);
    });
    
    socket.on('playlist', (data) => {
        setPlayList(data)
    });
   });

  return (
    <div className="App">
      {console.log(authCode)}
      <Search authCode={authCode} />
    </div>
  );
}

export default App;
