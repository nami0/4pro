var database = firebase.database();
let room = "speech_room";
const user = document.getElementById("user");
const name = document.getElementById("name");
const send = document.getElementById("send");
const reset = document.getElementById("reset");
const output1 = document.getElementById("output1");
const output2 = document.getElementById("output2");
const output3 = document.getElementById("output3");

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
	speechVolume: finalTranscript.length,
	script: finalTranscript,
    });
    readOnceWithGet();
});
reset.addEventListener('click', function() {
    database.ref(room+'/'+user.value).set({
	name: null,
	speechVolume: 0,
	script: null,
    });
    readOnceWithGet();
});
//データを更新
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+user.value).set({
	name: name.value,
	speechVolume: finalTranscript.length,
	script: finalTranscript,
    });
}

//get()を使用してデータを 1 回読み取る
function readOnceWithGet() {
    const dbRef = firebase.database().ref(room);
    for(let i=1; i<4; i++){
	dbRef.child("user"+i).get().then((snapshot) => {
	    if (snapshot.exists()) {
		const v = snapshot.val();
		const k = snapshot.key;
		let str = '<hr>';
		str += '<div class="name">名前：'+v.name+'</div>';
		str += '<div class="text">発言量：'+v.speechVolume+'</div>';
		str += '<div class="script">発言内容：'+v.script+'</div>';
		str += '<hr>';
		if (k==="user1") output1.innerHTML = str;
		else if (k==="user2") output2.innerHTML = str;
		else output3.innerHTML = str;
	    } else {
		console.log("No data available");
	    }
	}).catch((error) => {
	    console.error(error);
	});
    }
}

let data = [];
var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
	datasets: [{
	    label:"user1",
	    borderColor: "rgba(255,0,0,1)",
	    backgroundColor:"rgba(255,0,0,0)",
	    data: [],
	},{
	    label:"user2",
	    borderColor: "rgba(0,255,0,1)",
	    backgroundColor:"rgba(0,255,0,0)",
	    data: [],
	},{
	    label:"user3",
	    borderColor: "rgba(0,0,255,1)",
	    backgroundColor:"rgba(0,0,255,0)",
	    data: [],
	}]
    },
    options: {
	scales: {
	    x: {
		type: 'realtime',
		realtime: {
		    duration: 20000,  // 過去20000ミリ秒のデータを表示
		    refresh: 1000,    // onRefresh コールバックを1000ミリ秒毎に呼び出し
		    delay: 1000,      // 1000ミリ秒の遅延により、次の値が確定し線が完全に引けてから表示
		    pause: false,     // チャートは一時停止していない
		    ttl: undefined,   // データはチャートから消えると自動的に削除
		    frameRate: 30,    // データポイントを毎秒30回描画

		    
		    onRefresh: chart => {
			for(let i=0; i<3; i++) {
			    getLatestData();
			    chart.data.datasets[i].data.push(data[i]);
			}
		    }
		}
	    }
	}
    }
});

function getLatestData() {
    const dbRef = firebase.database().ref(room);
    for(let i=1; i<4; i++){
	dbRef.child("user"+i).get().then((snapshot) => {
	    if (snapshot.exists()) {
		const v = snapshot.val();
		const k = snapshot.key;
		data[i-1] = {
		    x: Date.now(),
		    y: v.speechVolume
		}
	    } else {
		console.log("No data available");
	    }
	}).catch((error) => {
	    console.error(error);
	});
    }
}
