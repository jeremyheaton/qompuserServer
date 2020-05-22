import React, { useState } from 'react';
import '../App.css';
import {Badge} from 'react-bootstrap'

const PlayList = ({playlist}) => {

  console.log(playlist);
  const results = playlist.map(track => (
    <div class="row">
      <div id={track.id}> {track.artistname} : {track.songname}
        <span class="label label-default"> <Badge variant="secondary">{track.count} </Badge></span>
      </div>
    </div>
  ));

  return (
    <div>
      {results}
    </div>
  );
}

export default PlayList;
