import React, { Fragment, useState } from 'react';
import '../App.css';
import getTracks from '../services'
import { Button, ListGroup, Container } from 'react-bootstrap';


const Search = ({ authCode, selectSong }) => {

  const [tracks, setTracks] = useState([]);
  const [input, setInput] = useState('');

  const handleInputChange = e => {
    const { value } = e.target;
    console.log(value);
    setInput(value);
  }

  const searchTracks = (authCode, query) => {
    getTracks(query, authCode).then(response => {
      setTracks(response.tracks.items);
    })
  }

  const results = tracks.map(track => (
    <ListGroup.Item>
      <Button onClick={() => selectSong(track.id, track.name, track.artists[0].name)}
        source="spotify"
        songid={track.id}
        songname={track.name}
        songartist={track.artists[0].name} id="add-to-lists">
        <div id={track.id}>{track.name} By {track.artists[0].name}</div>
      </Button>
    </ListGroup.Item>
  ));
  console.log(tracks);
  return (
    <Container>
      <input type="text"
        onChange={handleInputChange}
        value={input} class="form-control" placeholder="Type an Artist Name" />
      <Button onClick={() => searchTracks(authCode, input)}> Submit </Button>
      <ListGroup>
        {results}
      </ListGroup>
    </Container>

  );
}

export default Search;
