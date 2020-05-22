const getTracks = (query, authCode) => {
    return fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
        method: 'GET',
        mode: 'cors', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authCode
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
      }).then(response => response.json())
};

export default getTracks;