import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, set, get, update, ref, child, remove, onValue, increment } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx23YGbatU-hgo1PnUVmiWL6LxNJnRdNE",
    authDomain: "chatapp-5ae27.firebaseapp.com",
    projectId: "chatapp-5ae27",
    storageBucket: "chatapp-5ae27.appspot.com",
    messagingSenderId: "484411426179",
    appId: "1:484411426179:web:c14d4a9efd49e3752da2b6",
    measurementId: "G-80RL6JK8Z8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase();
var roomName;
var displayName;

window.addEventListener("load", () => {
    Notification.requestPermission();
});

document.querySelector("#create").addEventListener("click", () => {
    Swal.fire({
        title: "Create a Room",
        html: `
        <input class="swal2-input" id="username" placeholder="Room Name" />
        <input class="swal2-input" id="password" placeholder="Room Password" />
        <input class="swal2-input" id="display-name" placeholder="Your Display Name" />
        `,
        showCancelButton: true,
        preConfirm: () => {
            return new Promise((resolve, reject) => {
                var un = document.querySelector("input#username").value;
                var pw = document.querySelector("input#password").value;
                var dn = document.querySelector("input#display-name").value;
                if (un && pw && dn) resolve([un, pw, dn]);
                else {
                    swal.showValidationMessage("Please fill in the blanks!");
                    resolve("error");
                }
            });
        }
    }).then(res => {
        if (res.isConfirmed) {
            if (res.value != "error") {
                var data = res.value;
                set(ref(db, `Rooms/${data[0]}`), {
                    Name: data[0],
                    Password: data[1],
                    Owner: data[2],
                    Users: {
                        1: data[2]
                    },
                    Messages: {},
                    UserCount: 1,
                    MessageCount: 1
                }).then(() => {
                    window.addEventListener("beforeunload", (event) => {
                        document.querySelector("button.leave").click();
                        event.returnValue = true;
                    });
                    document.querySelector(".chatroom .send").addEventListener("click", () => {
                        var postData = {};
                        get(child(ref(db), `Rooms/${roomName}`)).then(snapshot => {
                            postData[snapshot.val().MessageCount] = "👑 " + displayName + ": " + document.querySelector("input.type").value;
                        }).then(() => {
                            update(ref(db, `Rooms/${roomName}/Messages`), postData);
                            update(ref(db, `Rooms/${res.value[0]}`), {
                                MessageCount: increment(1)
                            });
                            document.querySelector("input.type").value = "";
                        });
                    });
                    document.querySelector(".first").style.display = "none";
                    document.querySelector(".chatroom").style.display = "block";
                    document.querySelector(".chatroom h1.title").innerText = res.value[0];
                    roomName = res.value[0];
                    displayName = res.value[2];
                    onValue(ref(db, `Rooms/${data[0]}/Users`), (snapshot) => {
                        document.querySelector(".chatroom .users").innerHTML = "";
                        Object.keys(snapshot.val()).forEach((item, index) => {
                            document.querySelector(".chatroom .users").innerHTML += `
                                <div class="user">${snapshot.val()[item]}</div>
                            `;
                            if (index + 1 === Object.keys(snapshot.val()).length && notif) {
                                new Notification(
                                    "New User | Tempchat",
                                    {
                                        body: snapshot.val()[item]
                                    }
                                );
                            }
                        });
                    });
                    onValue(ref(db, `Rooms/${res.value[0]}/Messages`), (snapshot) => {
                        document.querySelector(".chatroom .messages").innerHTML = "";
                        Object.keys(snapshot.val()).forEach((item, index) => {
                            document.querySelector(".chatroom .messages").innerHTML = document.querySelector(".chatroom .messages").innerHTML + `
                                <div class="message ${snapshot.val()[item].startsWith(displayName + ":") || snapshot.val()[item].startsWith("👑 " + displayName + ":") ? "me" : "other"}">${snapshot.val()[item]}</div>
                            `;
                            if (index + 1 === Object.keys(snapshot.val()).length &&  document.visibilityState === "hidden") {
                                new Notification(
                                    "New Message | Tempchat",
                                    {
                                        body: snapshot.val()[item]
                                    }
                                );
                            }
                        });
                        if (!snapshot.exists()) Swal.fire({
                            icon: "error",
                            text: "Hey, this room is closed!"
                        }).then(() => { location.reload() });
                    });
                    document.querySelector("button.leave").addEventListener("click", () => {
                        remove(ref(db), `Rooms/${res.value[0]}`).then(() => {
                            location.reload();
                        });
                    });
                });
            }
            else {
                swal.enableConfirmButton();
            }
        }
    });
});

document.querySelector("#join").addEventListener("click", () => {
    Swal.fire({
        title: "Join a Room",
        html: `
        <input class="swal2-input" id="username" placeholder="Room Name" />
        <input class="swal2-input" id="password" placeholder="Room Password" />
        <input class="swal2-input" id="display-name" placeholder="Your Display Name" />
        `,
        showCancelButton: true,
        preConfirm: () => {
            return new Promise((resolve, reject) => {
                var un = document.querySelector("input#username").value;
                var pw = document.querySelector("input#password").value;
                var dn = document.querySelector("input#display-name").value;
                if (un && pw && dn) {
                    get(child(ref(db), `Rooms/${un}`)).then(snapshot => {
                        if (!snapshot.exists() || snapshot?.val()?.Password != pw) {
                            swal.showValidationMessage("Wrong credentials!");
                            resolve("error");
                        }
                        else resolve([un, pw, dn]);
                    });
                }
                else {
                    swal.showValidationMessage("Please fill in the blanks!");
                    resolve("error");
                }
            });
        }
    }).then(res => {
        if (res.isConfirmed) {
            if (res.value != "error") {
                update(ref(db, `Rooms/${res.value[0]}`), {
                    UserCount: increment(1)
                }).then(() => {
                    window.addEventListener("beforeunload", (event) => {
                        document.querySelector("button.leave").click();
                        event.returnValue = true;
                    });
                    document.querySelector(".chatroom .send").addEventListener("click", () => {
                        var postData = {};
                        get(child(ref(db), `Rooms/${roomName}`)).then(snapshot => {
                            postData[snapshot.val().MessageCount] = displayName + ": " + document.querySelector("input.type").value;
                        }).then(() => {
                            update(ref(db, `Rooms/${roomName}/Messages`), postData);
                            update(ref(db, `Rooms/${res.value[0]}`), {
                                MessageCount: increment(1)
                            });
                            document.querySelector("input.type").value = "";
                        });
                    });
                    get(child(ref(db), `Rooms/${res.value[0]}`)).then(snapshot => {
                        if (!snapshot.exists()) {
                            alert("Wrong credentials!");
                            swal.enableConfirmButton();
                            return;
                        }
                        var postData = {};
                        postData[snapshot.val().UserCount] = res.value[2];
                        update(ref(db, `Rooms/${res.value[0]}/Users`), postData).then(() => {
                            roomName = res.value[0];
                            displayName = res.value[2];
                            get(child(ref(db), `Rooms/${res.value[0]}`)).then(childSnapshot => {
                                Object.keys(snapshot.val().Users).forEach((item, index) => {
                                    document.querySelector(".chatroom .users").innerHTML += `
                                        <div class="user">${childSnapshot.val().Users[item]}</div>
                                    `;
                                    if (index + 1 === Object.keys(snapshot.val()).length && notif) {
                                        new Notification(
                                            "New User | Tempchat",
                                            {
                                                body: snapshot.val()[item]
                                            }
                                        );
                                    }
                                });
                            }).then(() => {
                                onValue(ref(db, `Rooms/${res.value[0]}/Users`), (snapshot) => {
                                    document.querySelector(".chatroom .users").innerHTML = "";
                                    Object.keys(snapshot.val()).forEach((item,index) => {
                                        document.querySelector(".chatroom .users").innerHTML += `
                                            <div class="user">${snapshot.val()[item]}</div>
                                        `;
                                        if (index + 1 === Object.keys(snapshot.val()).length &&  document.visibilityState === "hidden") {
                                            new Notification(
                                                "New Message | Tempchat",
                                                {
                                                    body: snapshot.val()[item]
                                                }
                                            );
                                        }
                                    });
                                    if (!snapshot.exists()) Swal.fire({
                                        icon: "error",
                                        text: "Hey, this room is closed!"
                                    }).then(() => { location.reload() });
                                });
                                onValue(ref(db, `Rooms/${res.value[0]}/Messages`), (snapshot) => {
                                    document.querySelector(".chatroom .messages").innerHTML = "";
                                    Object.keys(snapshot.val()).forEach(item => {
                                        document.querySelector(".chatroom .messages").innerHTML = document.querySelector(".chatroom .messages").innerHTML + `
                                            <div class="message ${snapshot.val()[item].startsWith(displayName + ":") || snapshot.val()[item].startsWith("👑 " + displayName + ":") ? "me" : "other"}">${snapshot.val()[item]}</div>
                                        `;
                                    });
                                });
                                if (!snapshot.exists()) location.reload();
                            });
                            document.querySelector(".chatroom h1.title").innerText = res.value[0];
                            document.querySelector(".first").style.display = "none";
                            document.querySelector(".chatroom").style.display = "block";
                            document.querySelector("button.leave").addEventListener("click", () => {
                                remove(ref(db), `Rooms/${res.value[0]}/Users/${snapshot.val().UserCount}`).then(() => {
                                    location.reload();
                                });
                            });
                        });
                    });
                });
            }
            else {
                swal.enableConfirmButton();
            }
        }
    })
});

document.body.addEventListener("keydown", (event) => {
    if (event.keyCode === 13) document.querySelector(".chatroom .send").click();
});