// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0m8mvbd7wDfB9ov7dtVfuzxlLa4kKnhk",
  authDomain: "login-form-cccbb.firebaseapp.com",
  projectId: "login-form-cccbb",
  storageBucket: "login-form-cccbb.firebasestorage.app",
  messagingSenderId: "555060780307",
  appId: "1:555060780307:web:0608080dfb6a785a998ee6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// DOM Elements - Auth
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');
const homeSection = document.getElementById('home-section');
const submitSignUp = document.getElementById('submitSignUp');
const submitSignIn = document.getElementById('submitSignIn');
const signoutBtn = document.getElementById('signout');

// DOM Elements - Chat
const prompt = document.getElementById('prompt');
const submitbtn = document.getElementById('submit');
const chatContainer = document.querySelector(".chat-container");
const imagebtn = document.getElementById('image');
const image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

// Gemini API URL
const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDDg_sSmEKCkiyi5zdmzNM0DXpMGQPGN9s";

// Chat data
let conversationHistory = [];
let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

// Helper Functions
function showMessage(message, divId) {
    var messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function () {
        messageDiv.style.opacity = 0;
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 300);
    }, 5000);
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function resetFileInput() {
    // Create a new file input element
    const newFileInput = document.createElement('input');
    newFileInput.type = 'file';
    newFileInput.accept = 'images/*';
    newFileInput.hidden = true;
    
    // Copy the event listener to the new element
    newFileInput.addEventListener("change", () => {
        const file = newFileInput.files[0];
        if (!file) return;

        let reader = new FileReader();
        reader.onload = (e) => {
            let base64string = e.target.result.split(",")[1];
            user.file = {
                mime_type: file.type,
                data: base64string
            };
            image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
            image.classList.add("choose");
        };
        reader.readAsDataURL(file);
    });
    
    // Replace the old input with the new one
    const oldInput = imagebtn.querySelector("input");
    imagebtn.replaceChild(newFileInput, oldInput);
    
    // Update the reference
    imageinput = newFileInput;
}

// Chat Functions
async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    
    // Add the new user message to conversation history
    conversationHistory.push({
        role: "user",
        parts: [{ text: user.message }].concat(user.file.data ? [{ inline_data: user.file }] : [])
    });
    
    // Format the request with the full conversation history
    let RequestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: conversationHistory
        })
    };

    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        
        // Add the AI response to conversation history
        conversationHistory.push({
            role: "model",
            parts: [{ text: apiResponse }]
        });
        
        text.innerHTML = apiResponse;
    }
    catch(error) {
        console.log(error);
        text.innerHTML = "Sorry, I couldn't process that request.";
    }
    finally {
        // Scroll to latest chat
        chatContainer.scrollTo({top: chatContainer.scrollHeight, behavior: "smooth"});

        // Reset image input UI
        image.src = `img.svg`;
        image.classList.remove("choose");

        // Reset user file data for next message, but keep conversation history
        user.file = { mime_type: null, data: null };
    }
}

function handlechatResponse(userMessage) {
    if (!userMessage && !user.file.data) return; // Don't send empty messages
    
    user.message = userMessage;

    let html = `<img src="user.png" alt="" id="userImage" width="8%">
        <div class="user-chat-area">
        ${user.message || ""}
        ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
        </div>`;
    
    prompt.value = ""; // Clear input field
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    // Scroll to bottom
    chatContainer.scrollTo({top: chatContainer.scrollHeight, behavior: "smooth"});

    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
            <div class="ai-chat-area">
            <img src="loading.webp" alt="" class="load" width="50px">
            </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
        
        // Reset file input after sending
        if (user.file.data) {
            resetFileInput();
        }
    }, 600);
}

// Authentication Functions
function checkAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            signInForm.style.display = "none";
            signUpForm.style.display = "none";
            homeSection.style.display = "flex";
            // Initialize the chat with a welcome message
            setTimeout(() => {
                const welcomeMsg = `Welcome back, ${user.email}! How can I help you today?`;
                // Update the initial AI message
                const aiChatArea = document.querySelector(".ai-chat-area");
                if (aiChatArea) {
                    aiChatArea.textContent = welcomeMsg;
                }
                // Add this welcome message to the conversation history
                conversationHistory = [
                    {
                        role: "model",
                        parts: [{ text: welcomeMsg }]
                    }
                ];
            }, 300);
        } else {
            // User is signed out
            signInForm.style.display = "block";
            signUpForm.style.display = "none";
            homeSection.style.display = "none";
        }
    });
}

// Event Listeners - Auth
signUpButton.addEventListener('click', function() {
    signInForm.style.display = "none";
    signUpForm.style.display = "block";
});

signInButton.addEventListener('click', function() {
    signInForm.style.display = "block";
    signUpForm.style.display = "none";
});

submitSignUp.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    
    // Regular expression for validating email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    // Check if the email is valid
    if (!emailRegex.test(email)) {
        showMessage('Invalid email address! Please enter a valid email.', 'signUpMessage');
        return;
    }
    
    // Check if the password is less than 6 characters
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'signUpMessage');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                firstName: firstName,
                lastName: lastName
            };

            showMessage('Account Created Successfully', 'signUpMessage');
            
            // Store user in Firestore
            const docRef = doc(db, "users", user.uid);
            setDoc(docRef, userData)
                .then(() => {
                    // Switch to home after successful registration
                    signInForm.style.display = "none";
                    signUpForm.style.display = "none";
                    homeSection.style.display = "flex";
                })
                .catch((error) => {
                    console.error("Error writing document", error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/email-already-in-use') {
                showMessage('Email Address Already Exists!!!', 'signUpMessage');
            } else {
                showMessage('Unable to create user', 'signUpMessage');
            }
        });
});

submitSignIn.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showMessage('Login is Successful', 'signInMessage');
            const user = userCredential.user;
            localStorage.setItem('loggedInUserId', user.uid);
            // Switch to home after successful login
            signInForm.style.display = "none";
            signUpForm.style.display = "none";
            homeSection.style.display = "flex";
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/invalid-credential') {
                showMessage('Incorrect Email or Password', 'signInMessage');
            } else {
                showMessage('Account does not Exist', 'signInMessage');
            }
        });
});

signoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // Sign-out successful, reset chat history
        conversationHistory = [];
        localStorage.removeItem('loggedInUserId');
        signInForm.style.display = "block";
        homeSection.style.display = "none";
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Event Listeners - Chat
prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        handlechatResponse(prompt.value);
    }
});

submitbtn.addEventListener("click", () => {
    handlechatResponse(prompt.value);
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click();
});

// Initialize the app and check auth status on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Initialize image input reference
    imageinput = document.querySelector("#image input");
});