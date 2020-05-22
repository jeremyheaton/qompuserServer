import React,{ useState } from 'react';
import '../App.css';
import getTracks from '../services'

const Search = ({authCode}) => {

  const [tracks, setTracks] = useState({});
  const [input, setInput] = useState('');

  const handleInputChange = e => {
    const {value} = e.target;
    console.log(value);
    setInput(value);
  }

  const searchTracks = (authCode, query) => {
    console.log(authCode);
    getTracks(query, authCode).then(response => {
      setTracks(response);
    })
  }

  return (
    <div id="searchcontainer">
          <input type="text"                     
            onChange={handleInputChange}
            value={input} class="form-control" placeholder="Type an Artist Name"/>
          <button onClick={() => searchTracks(authCode, input)}> Submit </button>
      <div className="results">
        {/* <button class="btn btn-primary song" source="spotify" songid={{id}} songname="{{name}}"
                  songartist="{{artists.0.name}}" id="add-to-lists">
        <div id={{id}}>{{name}} By {{artists.0.name}}</div>
          </button> */}

      </div>
    </div>

  );
}

export default Search;
