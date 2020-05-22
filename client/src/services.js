const getTracks = ({query, authCode}) => {
    return fetch('https://api.spotify.com/v1/search', {
        method: 'POST',
        mode: 'cors', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authCode
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer', 
        body: JSON.stringify({
            q: query,
            type: 'track'
        })
      }).then(response => response.json())
};

export default getTracks;