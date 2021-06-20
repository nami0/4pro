var database = firebase.database();
let room = "speech_room";
const user = document.getElementById("user");
const name = document.getElementById("name");
const send = document.getElementById("send");
const output1 = document.getElementById("output1");
const output2 = document.getElementById("output2");

//音声認識
const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const getBtn = document.querySelector('#get-btn');
const resultDiv = document.querySelector('#result-div');
const resultDiv2 = document.querySelector('#result-div2');

SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = 'ja-JP';
recognition.interimResults = true;
recognition.continuous = true;

let finalTranscript = ''; // 確定した(黒の)認識結果

recognition.onresult = (event) => {
    let interimTranscript = ''; // 暫定(灰色)の認識結果
    for (let i = event.resultIndex; i < event.results.length; i++) {
	let transcript = event.results[i][0].transcript;
	if (event.results[i].isFinal) {
	    finalTranscript += transcript;
	} else {
	    interimTranscript = transcript;
	}
    }
    resultDiv.innerHTML = finalTranscript + '<i style="color:#ddd;">' + interimTranscript + '</i>';
    resultDiv2.innerHTML = finalTranscript.length; // 文字数
    
    setSpeechVolume(finalTranscript);
    readOnceWithGet();
}


startBtn.onclick = () => {
    recognition.start();
}
stopBtn.onclick = () => {
    recognition.stop();
}

//送信処理
send.addEventListener('click', function() {
    database.ref(room+'/'+user.value).set({
	name: name.value,
	speechVolume: 0,
    });
    readOnceWithGet();
});
//データを更新
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+user.value).set({
	name: name.value,
	speechVolume: finalTranscript.length,
    });
}

//get()を使用してデータを 1 回読み取る
function readOnceWithGet() {
    const dbRef = firebase.database().ref(room);
    
    dbRef.child("user1").get().then((snapshot) => {
	if (snapshot.exists()) {
	    const v = snapshot.val();
	    const k = snapshot.key;
	    let str = "";
	    str += '<div class="name">名前：'+v.name+'</div>';
	    str += '<div class="text">発言量：'+v.speechVolume+'</div>';
	    if (k==="user1") output1.innerHTML = str;
	    else output.innerHTML = str;
	} else {
	    console.log("No data available");
	}
    }).catch((error) => {
	console.error(error);
    });

    dbRef.child("user2").get().then((snapshot) => {
	if (snapshot.exists()) {
	    const v = snapshot.val();
	    const k = snapshot.key;
	    let str = "";
	    str += '<div class="name">名前：'+v.name+'</div>';
	    str += '<div class="text">発言量：'+v.speechVolume+'</div>';
	    if (k==="user1") output1.innerHTML = str;
	    else output2.innerHTML = str;
	} else {
	    console.log("No data available");
	}
    }).catch((error) => {
	console.error(error);
    });
}
