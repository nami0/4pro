var database = firebase.database();
let room = "speech_room";
const allElements = document.getElementById("allElements");
const setting = document.getElementById("setting");
//const number = document.getElementById("number");
//const user = document.getElementById("user");
//const name = document.getElementById("name");
const reset = document.getElementById("reset");
const cautionResult = document.getElementById("cautionResult");
const collapseChart = document.getElementById("collapseChart");
const multiCollapse1 = document.getElementById("multiCollapse1");
const multiCollapse2 = document.getElementById("multiCollapse2");
const output = document.getElementById("output");
const outputStr = document.getElementById("outputStr");

//音声認識
const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const btnArea = document.querySelector('#btn-area');
const isRecognition = document.getElementById('isRecognition');
const getBtn = document.querySelector('#get-btn');
const resultDiv = document.querySelector('#result-div');
const resultDiv2 = document.querySelector('#result-div2');

//HTML表示
let n;
let user;
let name;
let cUser = [];
let cColorUser = [];
let cAudioUser = 0;
let cVolume = [];
firebase.database().ref(room).child("number").on("value",snapshot => {
    n = snapshot.val().number;
    for(let i=0; i<n; i++){
	cUser.push(false);
	cColorUser.push(false);
	cVolume.push(false);
    }
});
let isLookSpeechVolume;
let isAutoCaution;
let isCautionAll;
let isText;
let isColor;
let isAudio;
let cautionRange;
firebase.database().ref(room).child("setting").on("value",snapshot => {
    let v = snapshot.val();
    isLookSpeechVolume = v.isLookSpeechVolume;
    isAutoCaution = v.isAutoCaution;
    isCautionAll = v.isCautionAll;
    isText = v.isText;
    isColor = v.isColor;
    isAudio = v.isAudio;
    cautionRange = v.cautionRange;
    //writeSetting();
    writeHTML();
    setChart();
    setChart2();
});

let s = '';
let t = '';
let str = [];

let dataAll = [];
let sumSpeechVolume = 0;

let flag_speech = 0;
let flag_speech_stop = 0;
let finalTranscript = ''; // 確定した(黒の)認識結果

function vr_function() {
    if(flag_speech_stop == 1){
    } else {
	SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
	let recognition = new SpeechRecognition();

	recognition.lang = 'ja-JP';
	recognition.interimResults = true;
	recognition.continuous = true;

	recognition.onresult = (event) => {
	    let interimTranscript = ''; // 暫定(灰色)の認識結果
	    for (let i = event.resultIndex; i < event.results.length; i++) {
		let transcript = event.results[i][0].transcript;
		if (event.results[i].isFinal) {
		    finalTranscript += transcript;
		    vr_function();
		} else {
		    interimTranscript = transcript;
		    flag_speech = 1;
		}
	    }
	    isRecognition.innerHTML = "音声を認識中...";
	    setSpeechVolume(finalTranscript);
	    getLatestData();
	    writeSpeechVolume(finalTranscript,interimTranscript);
	    if(flag_speech_stop == 1){
		recognition.stop();
	    }
	}
	recognition.onsoundstart = function(){
	    isRecognition.innerHTML = "音声を認識中...";
	}
	recognition.onnomatch = function(){
	    isRecognition.innerHTML = "もう一度試してください";
	};
	recognition.onerror= function(){
	    isRecognition.innerHTML = "エラー";
	    if(flag_speech == 0) vr_function();
	};
	recognition.onsoundend = function(){
	    isRecognition.innerHTML = "停止中";
	    vr_function();
	};
	flag_speech = 0;
	recognition.start();
    }
}

function start(){
    flag_speech_stop = 0;
    vr_function();
}
function stop(){
    flag_speech_stop = 1;
    btnArea.innerHTML = '音声認識　<button id="start-btn" class="btn btn-primary" data-bs-toggle="button" onClick="start();">開始</button> <button id="stop-btn" class="btn btn-primary" onClick="stop();">終了</button>';
}

//データベースからデータを削除
function resetData(){
    database.ref(room+'/'+"user"+user).set(null);
    finalTranscript = '';
    writeSpeechVolume(finalTranscript,'');
    getLatestData();
}
//データベースに新しいデータをセット
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+"user"+user).set({
	name: setLabel(user-1),
	speechVolume: finalTranscript.length,
	script: finalTranscript,
	facilitator: false,
    });
}
//音声認識部分のHTML表示
function writeSpeechVolume(finalTranscript,interimTranscript){
    resultDiv.innerHTML = finalTranscript + '<i style="color:#ddd;">' + interimTranscript + '</i>';
    resultDiv2.value = finalTranscript.length; // 文字数
}

//chart表示
let data = [];
let data2 = [];
let rgb=[];
var chart;
var chart2;
function setChart(){
    var ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
	type: 'line',
	data: {
	    datasets: []
	},
	options: {
	    plugins: {
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
			    writeCaution();
			    if(isLookSpeechVolume == "all"){
				writeAllStr();
				for(let i=0; i<n; i++) {
				    if(chart.data.datasets[i] == undefined){
					if(dataAll[i] != undefined){
					    writeDatasets(i,i);
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
			    } else if(isLookSpeechVolume == "one"){
				writeMyStr();
				if(chart.data.datasets[0] == undefined){
				    writeDatasets(user-1,0);
				} else {
				    chart.data.datasets[0].data.push(data[user-1]);
				    chart.data.datasets[0].label = setLabel(user-1);
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
}
function setChart2(){
    var ctx2 = document.getElementById('myChart2').getContext('2d');
    chart2 = new Chart(ctx2, {
	type: 'line',
	data: {
	    datasets: []
	},
	options: {
	    plugins: {
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
			    writeCaution();
			    if(isLookSpeechVolume == "all"){
				writeAllStr();
				for(let i=0; i<n; i++) {
				    if(chart2.data.datasets[i] == undefined){
					if(dataAll[i] != undefined){
					    writeDatasets(i,i);
					}
				    } else {
					chart2.data.datasets[i].data.push(data2[i]);
					chart2.data.datasets[i].label = setLabel(i);
				    }
				}
				for(let i=chart2.data.datasets.length-1; i>=n; i--) {
				    chart2.data.datasets.splice(i,1);
				}
			    } else if(isLookSpeechVolume == "one"){
				writeMyStr();
				if(chart2.data.datasets[0] == undefined){
				    writeDatasets(user-1,0);
				} else {
				    chart2.data.datasets[0].data.push(data2[user-1]);
				    chart2.data.datasets[0].label = setLabel(user-1);
				    updateYAxes();
				}
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
}
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
function writeDatasets(i,j) {
    if(rgb[i] == null){
	rgb[i] = {
	    r: randomColor(),
	    g: randomColor(),
	    b: randomColor(),
	}
    }
    chart.data.datasets[j] = ({
	label: setLabel(i),
	borderColor: "rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",1)",
	backgroundColor:"rgba("+rgb[i].r+","+rgb[i].g+","+rgb[i].b+",0.4)",
	data: [],
    });
    chart2.data.datasets[j] = ({
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
    if(isLookSpeechVolume == "all"){
	writeAllTabHTML();
	writeCollapseShowAll();
    } else if(isLookSpeechVolume == "one"){
	writeMyTabHTML();
	writeCollapseShowAll();
    } else {
	writeCollapse();
    }
    output.innerHTML = s;
    outputStr.innerHTML = t;
}
function writeAllTabHTML(){
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
function writeMyTabHTML(){
    let i = user-1;
    s += '<li class="nav-item">';
    s += '<a href="#output0" class="nav-link active" data-bs-toggle="tab" id="label0">'+setLabel(i)+'</a>';
    s += '</li>';
    
    t += '<div id="output0" class="tab-pane fade show active">';
    t += '<div id="outputStr0"></div>'
    t += '</div>';
}
function writeCollapseShowAll(){
    collapseChart.innerHTML = '<div class="row"><div class="d-grid col-6 mx-auto"><a class="btn btn-outline-outline-right btn-sm" data-bs-toggle="collapse" href="#multiCollapseExample1" role="button" aria-expanded="false" aria-controls="multiCollapseExample1">発言量</a></div><div class="d-grid col-6 mx-auto"><button class="btn btn-outline-outline-right btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#multiCollapseExample2" aria-expanded="false" aria-controls="multiCollapseExample2">占有率</button></div></div>';
    multiCollapse1.innerHTML = '<div class="show multi-collapse" id="multiCollapseExample1"><div class="card card-body"><canvas id="myChart"></canvas></div></div>';
    multiCollapse2.innerHTML = '<div class="show multi-collapse" id="multiCollapseExample2"><div class="card card-body"><canvas id="myChart2"></canvas></div></div>';
}
function writeCollapse(){
    multiCollapse1.innerHTML = '<div class="collapse multi-collapse" id="multiCollapseExample1"><div class="card card-body"><canvas id="myChart"></canvas></div></div>';
    multiCollapse2.innerHTML = '<div class="collapse multi-collapse" id="multiCollapseExample2"><div class="card card-body"><canvas id="myChart2"></canvas></div></div>';
}
function writeAllStr() {
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
function writeMyStr() {
    let i = user-1;
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
    document.getElementById("label0").innerHTML = setLabel(i);
    document.getElementById("outputStr0").innerHTML = str[i];
}

let alpha = 1;
let alphaBack = 0;
let audio1 = new Audio("./sounds/sound01.mp3");
let audio2 = new Audio("./sounds/sound02.mp3");
let count1 = 0;
let count2 = 0;
database.ref(room).child("caution").on("child_changed",snapshot => {
    database.ref(room).child("caution").on("value",snapshot => {
	cUser = snapshot.val().user;
	cColorUser = snapshot.val().colorUser;
	cAudioUser = snapshot.val().audioUser;
	cVolume = snapshot.val().volume;
    });
});
function writeCaution(){
    cautionResult.innerHTML = "";
    let allVolume = 0;
    for(let i=0; i<n; i++){
	if(dataAll[i] != null){
	    allVolume += dataAll[i].volume;
	}
    }
    if(isAutoCaution){
	if(allVolume>100){
	    if(isText){
		if(isCautionAll){
		    for(let i=0; i<n; i++){
			if(data2[i].y >= cautionRange[0]){
			    cautionStrAuto(i+1,'over');
			}
			if(data2[i].y <= cautionRange[1]){
			    cautionStrAuto(i+1,'under');
			}
		    }
		} else {
		    if(data2[user-1].y >= cautionRange[0]){
			cautionStrAuto(user,'over');
		    }
		    if(data2[user-1].y <= cautionRange[1]){
			cautionStrAuto(user,'under');
		    }
		}
	    }
	    if(isColor){
		if(data2[user-1].y >= cautionRange[0]){
		    allElements.style.color = "rgba(0,0,0,"+alpha+")";
		    alpha -= 0.005;
		} else {
		    alpha = 1;
		    allElements.style.color = "rgba(0,0,0,1)";
		}
		if(data2[user-1].y <= cautionRange[1]){
		    allElements.style.backgroundColor = "rgba(0,0,0,"+alphaBack+")";
		    alphaBack += 0.005;
		} else {
		    alphaBack = 0;
		    allElements.style.backgroundColor = "rgba(0,0,0,0)"
		}
	    }
	    if(isAudio){
		if(data2[user-1].y >= cautionRange[0]){
		    if(count1<=0){
			audio2.play();
			count1 = 0;
		    }
		    count1 += 1;
		    if(count1>100) count1=0;
		} else if(data2[user-1].y <= cautionRange[1]){
		    if(count2<=0){
			audio1.play();
			count2=0;
		    }
		    count2 += 1;
		    if(count2>100) count2=0;
		} else {
		    count1 = 0;
		    count2 = 0;
		}
	    }
	}
    } else {
	if(cUser!=null){
	    for(let i=0; i<n; i++){
		if(cUser[i]){
		    if(isCautionAll){
			if(user != 0){
			    cautionStr(i+1,cVolume[i]);
			}
		    } else {
			if(user == i+1){
			    cautionStr(user,cVolume[i]);
			}	
		    }
		}
	    }
	    if(cColorUser[user-1]){
		if(cVolume[user-1]=="over"){
		    allElements.style.color = "rgba(0,0,0,"+alpha+")";
		    alpha -= 0.005;
		} else {
		    allElements.style.backgroundColor = "rgba(0,0,0,"+alphaBack+")";
		    alphaBack += 0.005;
		}
	    } else {
		alpha = 1;
		alphaBack = 0;
		allElements.style.color = "rgba(0,0,0,1)";
		allElements.style.backgroundColor = "rgba(0,0,0,0)";
	    }
	    if(cAudioUser == user){
		if(cVolume[user-1]=="over"){
		    audio2.play();
		} else {
		    audio1.play();
		}
	    }
	    database.ref(room+"/caution").set({
		user: cUser,
		colorUser: cColorUser,
		audioUser: 0,
		volume: cVolume,
	    });
	}
    }
}
function cautionStrAuto(cUser,cVolume){
    if(cVolume == 'over'){
	cautionResult.innerHTML += "注意喚起："+setLabel(cUser-1)+"さん、喋りすぎです！<br>";
    }　else if(cVolume == 'under') {
	cautionResult.innerHTML += "注意喚起："+setLabel(cUser-1)+"さん、もっと喋って！<br>";
    } else {
	cautionResult.innerHTML += "";
    }
}
function cautionStr(cUser,cVolume){
    if(cVolume == 'over'){
	//alert("注意喚起："+setLabel(cUser-1)+"さん、喋りすぎ！");
	cautionResult.innerHTML += "注意喚起："+setLabel(cUser-1)+"さん、喋りすぎ！<br>";
    }　else if(cVolume == 'under') {
	//alert("注意喚起："+setLabel(cUser-1)+"さん、もっと喋って！");
	cautionResult.innerHTML += "注意喚起："+setLabel(cUser-1)+"さん、もっと喋って！<br>";
    }
}
function getUrlVars() {
    var vars = [],
        max = 0,
        hash = "",
        array = "";
    var url = window.location.search;

    hash = url.slice(1).split("&");
    max = hash.length;
    for (var i = 0; i < max; i++) {
        array = hash[i].split("=");
        vars.push(array[0]);
        vars[array[0]] = decodeURI(array[1]);
    }
    return vars;
}
window.onload = function() {
    para = getUrlVars();
    userID = para["user"];
    user = userID;
    nameID = para["name"];
    name = nameID;
}
