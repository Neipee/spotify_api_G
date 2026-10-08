const clientId = "120de1a5c48d486a993aa82eed9b0029";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");


let accessToken = localStorage.getItem("access_token");
console.log("accessToken from localStorage:", accessToken);
if (!accessToken) {
  accessToken = null;
  console.log("test1");
  if (!code) {
    await redirectToAuthCodeFlow(clientId);
    console.log("test2");
  } else {
    accessToken = await getAccessToken(clientId, code);
    if (accessToken) localStorage.setItem("access_token", accessToken); 
    history.replaceState(null, "", "/");
  }
}
console.log("Access Token 1   :", accessToken);

if (accessToken) {
  populateUI(await fetchProfile(accessToken), null, null, null);
}
console.log("Access Token:", accessToken);

export async function redirectToAuthCodeFlow(clientId: string) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://127.0.0.1:5173/callback");
  params.append("scope", "user-read-private user-read-email user-top-read user-follow-read");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://127.0.0.1:5173/callback");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token: string): Promise<UserProfile> {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

async function fetchTopArtist(token: string): Promise<UserTopArtists> {
  let timerange = document.getElementById("timeRange");
  let tr = (timerange as HTMLSelectElement).value;
  const result = await fetch("https://api.spotify.com/v1/me/top/artists?time_range="+tr, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

async function fetchFollowedArtist(token: string): Promise<UserFollowedArtists> {
  const result = await fetch("https://api.spotify.com/v1/me/following?type=artist", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

async function fetchTopTracks(token: string): Promise<UserTopTracks> {
  let timerange = document.getElementById("timeRange");
  let tr = (timerange as HTMLSelectElement).value;
  const result = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range="+tr, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

let visible = [0, 0, 0];
const buttons = ["topArtist", "topTrack", "followedArtist"];
const divs = ["topArtistsDiv", "topTracksDiv", "followedArtistsDiv"];

const loaders = [
  async (token: string) => populateUI(null, await fetchTopArtist(token), null, null),
  async (token: string) => populateUI(null, null, await fetchTopTracks(token), null),
  async (token: string) => populateUI(null, null, null, await fetchFollowedArtist(token)),
];

visible.push(0);
buttons.push("searchMusic");
divs.push("searchDiv");
loaders.push(async () => searchMusic());

async function loadVisible() {
  const i = visible.indexOf(1);
  accessToken = localStorage.getItem("access_token");
  if (i !== -1 && accessToken) await loaders[i](accessToken);
}

buttons.forEach((buttonId, i) => {
  document.getElementById(buttonId)!.addEventListener("click", () => {
    visible = [0, 0, 0, 0];
    visible[i] = 1;
    divs.forEach((divId, j) => {
      document.getElementById(divId)!.hidden = visible[j] === 0;
    });
    loadVisible();
  });
});

document.getElementById("timeRange")!.addEventListener("change", loadVisible);

let searchOffset = 0;
const searchLimit = 10;

async function fetchSearch(token: string, query: string, offset: number): Promise<SearchTracks> {
  const result = await fetch("https://api.spotify.com/v1/search?type=track&limit=" + searchLimit + "&offset=" + offset + "&q=" + encodeURIComponent(query), {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

function populateSearch(search: SearchTracks) {
  document.getElementById("searchResults")!.innerHTML = search.tracks.items.map(track => `
    <li class="track">
      ${track.album.images[0] ? `<img src="${track.album.images[0].url}" width="64" height="64" alt="">` : ""}
      <h3>${track.name}</h3>
      <p>${track.artists.map(a => a.name).join(", ")}</p>
      <button class="play" data-id="${track.id}">Écouter</button>
    </li>
  `).join("");

  document.getElementById("pageInfo")!.innerText = "Page " + (searchOffset / searchLimit + 1) + " / " + Math.ceil(search.tracks.total / searchLimit);
  (document.getElementById("prevPage") as HTMLButtonElement).disabled = search.tracks.previous === null;
  (document.getElementById("nextPage") as HTMLButtonElement).disabled = search.tracks.next === null;
}

async function searchMusic() {
  const query = (document.getElementById("searchInput") as HTMLInputElement).value;
  accessToken = localStorage.getItem("access_token");
  if (query && accessToken) populateSearch(await fetchSearch(accessToken, query, searchOffset));
}

document.getElementById("searchButton")!.addEventListener("click", () => {
  searchOffset = 0;
  searchMusic();
});

document.getElementById("prevPage")!.addEventListener("click", () => {
  searchOffset -= searchLimit;
  searchMusic();
});

document.getElementById("nextPage")!.addEventListener("click", () => {
  searchOffset += searchLimit;
  searchMusic();
});

document.getElementById("searchResults")!.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest(".play") as HTMLElement | null;
  if (!button) return;
  const player = document.getElementById("player") as HTMLIFrameElement;
  player.src = "https://open.spotify.com/embed/track/" + button.dataset.id;
  player.hidden = false;
});



function populateUI(profile: UserProfile | null, topArtists: UserTopArtists | null, topTracks: UserTopTracks | null, followedArtists: UserFollowedArtists | null) {
  if (profile) {
  document.getElementById("displayName")!.innerText = profile.display_name;
  if (profile.images[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar")!.appendChild(profileImage);
  }
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
  document.getElementById("uri")!.innerText = profile.uri;
  document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.innerText = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
  }


  
  if (topArtists) document.getElementById("topArtists")!.innerHTML = topArtists.items.map(artist => `
    <li class="artist">
      ${artist.images[0] ? `<img src="${artist.images[0].url}" width="64" height="64" alt="">` : ""}
      <h3>${artist.name}</h3>
      <a href="${artist.external_urls.spotify}" target="_blank">View on Spotify</a>
    </li>
  `).join("");

  if (topTracks) document.getElementById("topTracks")!.innerHTML = topTracks.items.map(track => `
    <li class="track">
      ${track.album.images[0] ? `<img src="${track.album.images[0].url}" width="64" height="64" alt="">` : ""}
      <h3>${track.name}</h3>
      <p>${track.artists.map(a => a.name).join(", ")}</p>
      <a href="${track.external_urls.spotify}" target="_blank">View on Spotify</a>
    </li>
  `).join("");

  if (followedArtists) document.getElementById("followedArtists")!.innerHTML = followedArtists.artists.items.map(artist => `
    <li class="artist">
      ${artist.images[0] ? `<img src="${artist.images[0].url}" width="64" height="64" alt="">` : ""}
      <h3>${artist.name}</h3>
      <a href="${artist.external_urls.spotify}" target="_blank">View on Spotify</a>
    </li>
  `).join("");
}


