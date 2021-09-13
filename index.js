var database = firebase.database();
let room = "speech_room";
const number = document.getElementById("number");
const user = document.getElementById("user");
const name = document.getElementById("name");
const send = document.getElementById("send");
const reset = document.getElementById("reset");
const output = document.getElementById("output");
const outputStr = document.getElementById("outputStr");

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
let s = '';
let t = '';
let str = [];

let dataAll = [];
let sumSpeechVolume = 0;

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
//データベースからデータを削除
reset.addEventListener('click', function() {
    database.ref(room+'/'+"user"+user.value).set(null);
    finalTranscript = '';
    writeSpeechVolume(finalTranscript,'');
    getLatestData();
});
//データベースに新しいデータをセット
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

//人数が変更された時
number.onchange = () => {
    n = number.value;
    getLatestData();
    writeHTML();
}

//chart表示
let data = [];
let data2 = [];
let rgb=[];
var ctx = document.getElementById('myChart').getContext('2d');
var ctx2 = document.getElementById('myChart2').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
	datasets: []
    },
    options: {
	plugins: {
	    title: {
		display: true,
		text: '発言量',
	    },
	},
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
			writeStr();
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
			for(let i=chart.data.datasets.length-1; i>=n; i--) {
			    chart.data.datasets.splice(i,1);
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
var chart2 = new Chart(ctx2, {
    type: 'line',
    data: {
	datasets: []
    },
    options: {
	plugins: {
	    title: {
		display: true,
		text: '占有率',
	    },
	},
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
			writeStr();
			for(let i=0; i<n; i++) {
			    if(chart2.data.datasets[i] == undefined){
				if(dataAll[i] != undefined){
				    writeDatasets(i);
				}
			    } else {
				chart2.data.datasets[i].data.push(data2[i]);
				chart2.data.datasets[i].label = setLabel(i);
			    }
			}
			for(let i=chart2.data.datasets.length-1; i>=n; i--) {
			    chart2.data.datasets.splice(i,1);
			}
		    }
		}
	    },
	    yAxes: {
		min: 0,
		max: 100
	    }
	}
    }
});
writeHTML();
//データベースからデータを読み取る
function getLatestData() {
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
	}).catch((error) => {
	    console.error(error);
	});
    }
    setDatas();
}
function setDatas() {
    sumSpeechVolume = 0;
    for(let i=0; i<n; i++){
	sumSpeechVolume += (dataAll[i]===undefined) ? 0 : dataAll[i].volume;
    }
    for(let i=0; i<n; i++){
	if(dataAll[i] === undefined){
	    data[i] = {
		x: Date.now(),
		y: 0
	    };
	    data2[i] = {
		x: Date.now(),
		y: 0
	    }
	}else{
	    data[i] = {
		x: Date.now(),
		y: dataAll[i].volume
	    };
	    if(sumSpeechVolume != 0){
		data2[i] = {
		    x: Date.now(),
		    y: Math.floor((dataAll[i].volume / sumSpeechVolume) * 100)
		}
	    } else {
		data2[i] = {
		    x: Date.now(),
		    y: 0
		}
	    }
	}
    }
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
    chart2.data.datasets[i] = ({
	label: setLabel(i),
	borderColor: "rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",1)",
	backgroundColor:"rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",0.4)",
	data: [],
    });
    chart.update();
    chart2.update();
}
function randomColor() {
    let rgb = Math.floor(Math.random() * (255 + 1));
    return rgb;
}
function setLabel(i){
    return (dataAll[i] != undefined && dataAll[i].name != "") ? dataAll[i].name
	: "No."+(i+1);
}
function updateYAxes(){
    let max = 0;
    let min = data[0].y;
    for(let i=0; i<n; i++){
	max = (data[i].y > max) ? data[i].y : max;
	min = (data[i].y < min) ? data[i].y : min;
    }
    chart.options.scales.yAxes.min = (min >= 10) ? min - 10 : 0;
    chart.options.scales.yAxes.max = max + 10;
}

//HTML表示
function writeHTML() {
    s = '';
    t = '';
    writeTabHTML();
    output.innerHTML = s;
    outputStr.innerHTML = t;
}
function writeTabHTML(){
    s += '<li class="nav-item">';
    s += '<a href="#output0" class="nav-link active" data-bs-toggle="tab" id="label0">'+setLabel(0)+'</a>';
    s += '</li>';
    for(let i=1; i<n; i++){
	s += '<li class="nav-item">';
	s += '<a href="#output'+i+'" class="nav-link" data-bs-toggle="tab" id="label'+i+'">'+setLabel(i)+'</a>';
	s += '</li>';
    }
    t += '<div id="output0" class="tab-pane fade show active">';
    t += '<div id="outputStr0"></div>'
    t += '</div>';
    for(let i=1; i<n; i++){
	t += '<div id="output'+i+'" class="tab-pane fade">';
	t += '<div id="outputStr'+i+'"></div>'
	t += '</div>';
    }
}
function writeStr() {
    for(let i=0; i<n; i++){
	if(dataAll[i] === undefined){
	    str[i] = "loading..."
	} else {
	    if(dataAll[i].name=="" && dataAll[i].volume==0 && dataAll[i].script==""){
		str[i] = "No data available"
	    } else {
		str[i] = 'No.'+(i+1)+'　名前：'+dataAll[i].name+'<br>';
		str[i] += '発言量：'+dataAll[i].volume+' ';
		str[i] += '('+ data2[i].y +'%)<br>';
		str[i] += '発言内容：'+dataAll[i].script;
	    }
	}
    }
    for(let i=0; i<n; i++){
	document.getElementById("label"+i).innerHTML = setLabel(i);
    }
    for(let i=0; i<n; i++){
	document.getElementById("outputStr"+i).innerHTML = str[i];
    }
}
