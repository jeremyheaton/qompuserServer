import React,{ useState, useEffect } from 'react';
import './App.css';
import './components/search'
import socketIOClient from 'socket.io-client';
import Search from './components/search';


function App() {

  const [socket, setSocket] = useState(socketIOClient("https://ancient-tor-6266.herokuapp.com/"));
  const [playlist, setPlayList] = useState({});
  const [authCode, setAuthCode] = useState({});
  
  useEffect(() => {
    socket.on('connect', function () {
      console.log("connected");
      socket.emit('subscribe', window.location.href.replace(/.*\//, ''));
    });
  
    socket.on('sendToken', (data) => {
        console.log(data);
        setAuthCode(data);
    });
    
    socket.on('playlist', (data) => {
        setPlayList(data)
    });
   }, []);

  return (
    <div className="App">
      {console.log(authCode)}
      <Search authCode={authCode} />
    </div>
  );
}

export default App;
