var database = firebase.database();
let room = "speech_room";
const send = document.getElementById("send");
const name = document.getElementById("name");
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
    
}


startBtn.onclick = () => {
    recognition.start();
}
stopBtn.onclick = () => {
    recognition.stop();
}

//送信処理
send.addEventListener('click', function() {
    database.ref(room+'/'+name.value).set({
	id: name.value,
	speechVolume: finalTranscript.length,
    });
});
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+name.value).set({
	id: name.value,
	speechVolume: finalTranscript.length,
    });
}


//受信処理
/*
database.ref(room+'/'+name.value).on("child_changed", function(data) {
    const v = data.val();
    const k = data.key;
    let str = "";
    str += '<div class="name">名前：'+v.id+'</div>';
    str += '<div class="text">発言量：'+v.speechVolume+'</div>';
    output1.innerHTML = str;
});
*/
database.ref(room+"/user1").on("value", function(data) {
    const v = data.val();
    const k = data.key;
    let str = "";
    str += '<div class="name">名前：'+k+'</div>';
    str += '<div class="text">発言量：'+v.speechVolume+'</div>';
    output1.innerHTML = str;
});
database.ref(room+"/user2").on("value", function(data) {
    const v = data.val();
    const k = data.key;
    let str = "";
    str += '<div class="name">名前：'+k+'</div>';
    str += '<div class="text">発言量：'+v.speechVolume+'</div>';
    output2.innerHTML = str;
});

