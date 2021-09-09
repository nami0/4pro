var database = firebase.database();
let room = "speech_room";
const number = document.getElementById("number");
const user = document.getElementById("user");
const name = document.getElementById("name");
const send = document.getElementById("send");
const reset = document.getElementById("reset");
const output = document.getElementById("output");

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

//HTML表示
let n = number.value;
let str = [];
let sumSpeechVolume = 0;
let dataAll = [];

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
    setSpeechVolume(finalTranscript);
    getLatestData();
    writeSpeechVolume(finalTranscript,interimTranscript);
}


startBtn.onclick = () => {
    recognition.start();
}
stopBtn.onclick = () => {
    recognition.stop();
}


//送信処理
send.addEventListener('click', function() {
    database.ref(room+'/'+"user"+user.value).set({
	name: name.value,
	speechVolume: finalTranscript.length,
	script: finalTranscript,
    });
    getLatestData();
});
reset.addEventListener('click', function() {
    database.ref(room+'/'+"user"+user.value).set({
	name: "",
	speechVolume: 0,
	script: "",
    });
    finalTranscript = '';
    writeSpeechVolume(finalTranscript,'');
    getLatestData();
});
//データを更新
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+"user"+user.value).set({
	name: name.value,
	speechVolume: finalTranscript.length,
	script: finalTranscript,
    });
}
//音声認識部分のHTML表示
function writeSpeechVolume(finalTranscript,interimTranscript){
    resultDiv.innerHTML = finalTranscript + '<i style="color:#ddd;">' + interimTranscript + '</i>';
    resultDiv2.innerHTML = finalTranscript.length; // 文字数
}

//chart表示
let data = [];
let rgb=[];
var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
	datasets: []
    },
    options: {
	scales: {
	    xAxes: {
		type: 'realtime',
		display: false,
		
		realtime: {
		    duration: 20000,  // 過去20000ミリ秒のデータを表示
		    refresh: 1000,    // onRefresh コールバックを1000ミリ秒毎に呼び出し
		    delay: 1000,      // 1000ミリ秒の遅延により、次の値が確定し線が完全に引けてから表示
		    pause: false,     // チャートは一時停止していない
		    ttl: undefined,   // データはチャートから消えると自動的に削除
		    frameRate: 30,    // データポイントを毎秒30回描画
		    
		    onRefresh: chart => {
			getLatestData();
			for(let i=0; i<n; i++) {
			    if(chart.data.datasets[i] == undefined){
				if(dataAll[i] != undefined){
				    writeDatasets(i);
				}
			    } else {
				chart.data.datasets[i].data.push(data[i]);
				chart.data.datasets[i].label = setLabel(i);
				updateYAxes();
			    }
			}
		    }
		}
	    },
	    yAxes: {
		min: 0,
	    }
	}
    }
});
//データベースからデータを読み取る
function getLatestData() {
    n = number.value;
    const dbRef = firebase.database().ref(room);
    for(let i=0; i<n; i++){
	dbRef.child("user"+(i+1)).get().then((snapshot) => {
	    if (snapshot.exists()) {
		const v = snapshot.val();
		const k = snapshot.key;
		dataAll[i] = {
		    name: v.name,
		    volume: v.speechVolume,
		    script: v.script
		}
	    } else {
		dataAll[i] = {
		    name: "",
		    volume: 0,
		    script: ""
		}
	    }
	    //console.log("No data available");
	}).catch((error) => {
	    console.error(error);
	});
	if(dataAll[i] === undefined){
	    data[i] = {
		x: Date.now(),
		y: 0
	    };
	}else{
	    data[i] = {
		x: Date.now(),
		y: dataAll[i].volume
	    };
	}
    }
    writeHTML();
}
function writeDatasets(i) {
    if(rgb[i] == null){
	rgb[i] = {
	    r: randomColor(),
	    g: randomColor(),
	    b: randomColor(),
	}
    }
    chart.data.datasets[i] = ({
	label: setLabel(i),
	borderColor: "rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",1)",
	backgroundColor:"rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",0.4)",
	data: [],
    });
    chart.update();
}
function setLabel(i){
    let label;
    if(dataAll[i].name != ""){
	label = dataAll[i].name;
    } else {
	label = "No."+(i+1);
    }
    return label;
}
function randomColor() {
    let rgb = Math.floor(Math.random() * (255 + 1));
    return rgb;
}
function updateYAxes(){
    let max = 0;
    let min = data[0].y;
    for(let i=0; i<n; i++){
	if(data[i].y > max){
	    max = data[i].y;
	}
	if(data[i].y < min){
	    min = data[i].y;
	}
    }
    if(min >= 10){
	chart.options.scales.yAxes.min = min - 10;
    } else {
	chart.options.scales.yAxes.min = 0;
    }
    chart.options.scales.yAxes.max = max + 10;
}

//HTML表示
function writeHTML() {
    for(let i=0; i<n; i++){
	if(dataAll[i] === undefined){
	} else {
	    sumSpeechVolume += dataAll[i].volume;
	}
	
    }
    for(let i=0; i<n; i++){
	if(dataAll[i] === undefined){
	    str[i] = "loading..."
	} else {
	    writeStr(i);
	}
    }
    
    output.innerHTML = outputStr(str);
    sumSpeechVolume = 0;
}
function writeStr(i) {
    if(dataAll[i].name=="" && dataAll[i].volume==0 && dataAll[i].script==""){
	str[i] = "No data available"
    } else {
	str[i] = '<div class="name">No.'+(i+1)+'　名前：'+dataAll[i].name+'</div>';
	str[i] += '<div class="volume">発言量：'+dataAll[i].volume+' ';
	if(sumSpeechVolume != 0){
	    str[i] += "("+Math.floor((dataAll[i].volume / sumSpeechVolume) * 100)+"%)";
	}
	str[i] += '</div><div class="script">発言内容：'+dataAll[i].script+'</div>';
    }
}
function outputStr(str) {
    let s = '<hr>';
    for(let i=0; i<n; i++){
	s += str[i];
	s += '<hr>';
    }
    return s;
}
