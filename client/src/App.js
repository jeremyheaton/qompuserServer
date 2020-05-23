import React, { useState, useEffect } from 'react';
import './App.css';
import './components/search'
import socketIOClient from 'socket.io-client';
import Search from './components/search';
import PlayList from './components/playlist'
import { Col, Row, Container } from 'react-bootstrap';


function App() {

  const [socket, setSocket] = useState(socketIOClient("https://ancient-tor-6266.herokuapp.com/"));
  let currentVotes = sessionStorage.getItem('votes');
  const [selectedSongs, setSelectedSongs] = useState(currentVotes ? JSON.parse(currentVotes) : {});
  const [playlist, setPlayList] = useState([]);
  const [authCode, setAuthCode] = useState({});
  const [room, setRoom] = useState(window.location.href.replace(/.*\//, ''));

  useEffect(() => {
    let set = new Set();
    socket.on('connect', () => {
      socket.emit('subscribe', room);
    });

    socket.on('sendtoken', (data) => {
      console.log(data);
      setAuthCode(data);
    });

    socket.on('playlist', (data) => {
      var output = '';
      for (var property in data) {
        output += property + ': ' + data[property] + '; ';
      }
      console.log(output);
      setPlayList(data.songs);
      set = new Set();
      data.songs.map(song => {
        set.add(song.id);
      })

      for (let song of Object.keys(selectedSongs)) {
        if (!set.has(song)) {
          delete selectedSongs[song];
        }
      }
      setSelectedSongs(selectedSongs);
      sessionStorage.setItem('votes', JSON.stringify(selectedSongs));
    });
  }, []);

  const sendSong = (message, song, artist) => {
    console.log(message in selectedSongs);
    console.log(!(message in selectedSongs));

    if (!(message in selectedSongs)) {
      socket.emit('addSong', {
        room,
        message,
        song,
        artist
      });
      selectedSongs[message] = message;
      sessionStorage.setItem('votes', JSON.stringify(selectedSongs));
      setSelectedSongs(selectedSongs);

    }
  }

  return (
    <Container className="App">
      <Row>
        <Col>
          <Search authCode={authCode} selectSong={sendSong} />
        </Col>
        <Col>
          <PlayList playlist={playlist} />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
