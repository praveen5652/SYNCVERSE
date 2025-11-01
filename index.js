// ================================
// 🎧 SYNCVERSE — Final Fixed & Working JS
// ================================

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔹 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBzsaGSp0oKyuiw513gP27wTlyTQerqJFc",
  authDomain: "newproject-cea15.firebaseapp.com",
  databaseURL: "https://newproject-cea15-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "newproject-cea15",
  storageBucket: "newproject-cea15.appspot.com",
  messagingSenderId: "367436307663",
  appId: "1:367436307663:web:f2ce2cf37d593843e86bba"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 🔹 Globals
const YOUTUBE_API_KEY = "AIzaSyDW7rhT9YA6suX4yDNVFUqbyyErAUT4-CU";
let playerReady = false;
let player;
let roomId = null;
let playlist = [];
let currentSong = null;
let userId = Math.random().toString(36).substr(2, 9);
let username = localStorage.getItem("syncverse_username") || "";

// ================================
// 🎵 Load YouTube API
// ================================
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 0 },
    videoId: "",
    events: {
      onReady: () => {
        playerReady = true;
        console.log("✅ YouTube Player Ready");
      },
      onStateChange: onPlayerStateChange,
    },
  });
};

// ================================
// 🎬 Update Firebase when song plays
// ================================
function onPlayerStateChange(event) {
  if (roomId && event.data === YT.PlayerState.PLAYING) {
    update(ref(database, `rooms/${roomId}/player`), {
      state: "PLAYING",
      videoId: currentSong,
      time: player.getCurrentTime(),
    });
  } else if (roomId && event.data === YT.PlayerState.PAUSED) {
    update(ref(database, `rooms/${roomId}/player`), {
      state: "PAUSED",
      videoId: currentSong,
      time: player.getCurrentTime(),
    });
  }
}

// ================================
// 👤 Username Handling
// ================================
const nameInput = document.getElementById("usernameInput");
const saveBtn = document.getElementById("saveNameBtn");
if (nameInput) nameInput.value = username;

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const val = nameInput.value.trim();
    if (!val) return alert("कृपया अपना नाम लिखें!");
    username = val;
    localStorage.setItem("syncverse_username", username);
    alert(`स्वागत है, ${username}!`);
  });
}

if (!username) {
  username = prompt("अपना नाम दर्ज करें:") || `Guest-${userId.slice(0, 4)}`;
  localStorage.setItem("syncverse_username", username);
}

// ================================
// 🏠 Join Room
/* ================================
document.getElementById('joinRoom').addEventListener('click', async () => {
  const input = document.getElementById('roomId');
  const roomIdInput = input.value.trim();

  if (roomIdInput.length !== 6) {
    alert('Room ID must be exactly 6 characters.');
    return; // stop further processing
  }

  roomId = roomIdInput;
  // Proceed with joining/creating the room
  input.value = roomId;

  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    await set(roomRef, {
      playlist: [],
      chat: [],
      users: {},
      player: {}
    });
    alert(`✅ New room created: ${roomId}`);
  } else {
    alert(` 🔹 Joined existing room: ${roomId}`);
  }
});*/

document.getElementById("joinRoom").addEventListener("click", async () => {
  const input = document.getElementById("roomId");
  roomId = input.value.trim() || Math.random().toString(36).substr(2, 9);
  input.value = roomId;

  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    await set(roomRef, { playlist: [], chat: [], users: {}, player: {} });
    alert(`✅ New room created: ${roomId}`);
  } else {
    alert(`🔹 Joined existing room: ${roomId}`);
  }

  joinRoom();
});


function joinRoom() {
  set(ref(database, `rooms/${roomId}/users/${userId}`), {
    name: username,
    joinedAt: Date.now(),
  });

  window.addEventListener("beforeunload", () => {
    set(ref(database, `rooms/${roomId}/users/${userId}`), null);
  });

  listenToRoom();
}
// Room join hone ke turant baad yeh karo:
import { onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
set(ref(database, `rooms/${roomId}/users/${userId}`), {
  name: username,
  joinedAt: Date.now(),
});

// ================================
// 🔁 Room Sync
// ================================
function listenToRoom() {
  if (!roomId) return;

  // Player
  onValue(ref(database, `rooms/${roomId}/player`), (snapshot) => {
    const data = snapshot.val();
    if (!data || !playerReady) return;  

    if (data.videoId && data.videoId !== currentSong) {
      currentSong = data.videoId;
      player.loadVideoById(currentSong);

      const found = playlist.find((s) => s.id === currentSong);
      document.getElementById("songInfo").textContent = found
        ? `🎵 ${found.title}`
        : "🎶 Playing...";
      document.getElementById("mobileSongInfo").textContent = found
        ? found.title
        : "Playing...";
    }
    // Timeline sync (ADD THIS SECTION)
  if (data.time !== undefined) {
    player.seekTo(data.time, true);
  }

    if (data.state === "PLAYING") player.playVideo();
    else if (data.state === "PAUSED") player.pauseVideo();
  });
  // Call this inside listenToRoom (or wherever you handle room updates)
onValue(ref(database, `rooms/${roomId}/users`), snapshot => {
  renderActiveUsers(snapshot.val());
});
// Tab/Window close hone par apne entry hata do
onDisconnect(ref(database, `rooms/${roomId}/users/${userId}`)).remove();
function renderActiveUsers(usersObj) {
  const userPanel = document.getElementById('active-users-list');
  userPanel.innerHTML = '';
  if (!usersObj) return (userPanel.innerHTML = '<li>No active users</li>');
  Object.values(usersObj).forEach(user => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="user-avatar">😊</span> <span class="user-name">${user.name}</span>`;
    userPanel.appendChild(li);
  });
}

// Room sync ke baad ya join ke turant baad yeh code lagao:
onValue(ref(database, `rooms/${roomId}/users`), snapshot => {
  renderActiveUsers(snapshot.val());
});



  // Playlist
  onValue(ref(database, `rooms/${roomId}/playlist`), (snapshot) => {
    playlist = snapshot.val() || [];
    renderPlaylist();
  });

  // Chat
  onValue(ref(database, `rooms/${roomId}/chat`), (snapshot) => {
    renderChat(snapshot.val() || []);
  });
}

// ================================
// 💬 Chat
// ================================
document.getElementById("sendMsg").addEventListener("click", async () => {
  const msg = document.getElementById("chatInput").value.trim();
  if (!msg || !roomId) return;

  const chatRef = ref(database, `rooms/${roomId}/chat`);
  const snapshot = await get(chatRef);
  const chat = snapshot.val() || [];

  chat.push({ user: username, userId, text: msg, time: Date.now() });
  await set(chatRef, chat);
  document.getElementById("chatInput").value = "";
});

function renderChat(messages) {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  messages.forEach((m) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${m.user}</strong>: ${m.text}`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================================
// 🔍 Search + Playlist + PlaySong
// ================================
document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("search").value.trim();
  if (!query) return;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&key=${YOUTUBE_API_KEY}&maxResults=15`
  );
  const data = await res.json();
  renderSearchResults(data.items);
});

function renderSearchResults(results) {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";
  results.forEach((item) => {
    const div = document.createElement("div");
    div.className = "p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700";
    div.innerHTML = `
      <img src="${item.snippet.thumbnails.default.url}" class="w-10 h-10 inline mr-2 rounded">
      ${item.snippet.title}
    `;
    div.addEventListener("click", () => addToPlaylist(item));
    container.appendChild(div);
  });
}

async function addToPlaylist(item) {
  if (!roomId) return alert("Join a room first!");
  const song = {
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.default.url,
  };
  playlist.push(song);
  await set(ref(database, `rooms/${roomId}/playlist`), playlist);
  playSong(song); // auto play first click
}

function playSong(song) {
  if (!song || !playerReady) return;
  currentSong = song.id;

  document.getElementById("songInfo").textContent = `🎵 ${song.title}`;
  document.getElementById("mobileSongInfo").textContent = song.title;

  player.loadVideoById(song.id);
  player.playVideo();

  update(ref(database, `rooms/${roomId}/player`), {
    videoId: song.id,
    state: "PLAYING",
    time: 0,
  });
}

function renderPlaylist() {
  const container = document.getElementById("playlist");
  container.innerHTML = "";
  if (playlist.length === 0) {
    document.getElementById("songInfo").textContent = "❌ No song playing";
    document.getElementById("mobileSongInfo").textContent = "No song";
    return;
  }
  playlist.forEach((song) => {
    const div = document.createElement("div");
    div.className = `p-2 rounded cursor-pointer hover:bg-gray-700 ${
      song.id === currentSong ? "bg-cyan-800" : "bg-gray-800"
    }`;
    div.innerHTML = `
      <img src="${song.thumbnail}" class="w-10 h-10 inline mr-2 rounded">
      ${song.title}
    `;
    div.addEventListener("click", () => playSong(song));
    container.appendChild(div);
  });
}
function renderActiveUsers(usersObj) {
  const userPanel = document.getElementById('active-users-list');
  userPanel.innerHTML = '';
  if (!usersObj) return userPanel.innerHTML = '<li>No active users</li>';
  Object.keys(usersObj).forEach(uid => {
    const user = usersObj[uid];
    const li = document.createElement('li');
    li.innerHTML = `<span class="user-avatar">😊</span> <span class="user-name">${user.name}</span>`;
    userPanel.appendChild(li);
  });
}


console.log("✅ SYNCVERSE JS fully working!");


// ================================
// ☀️ Theme Toggle
// ================================
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    document.getElementById('themeToggle').textContent =
        document.body.classList.contains('light') ? '☀️' : '🌙';
});


// ================================
// 🔹 Theme Toggle (Light/Dark)
// ================================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent =
    document.body.classList.contains("dark") ? "☀️" : "🌙";
  gsap.to(themeToggle, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
});
