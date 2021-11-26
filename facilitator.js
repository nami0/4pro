var database = firebase.database();
let room = "speech_room";
const setting = document.getElementById("setting");
const number = document.getElementById("number");
const user = document.getElementById("user");
const name = document.getElementById("name");
const caution = document.getElementById("caution");
let cautionName;
let cautionStopName;
const cautionResult = document.getElementById("cautionResult");
const cautionBtnResult = document.getElementById("cautionBtnResult");
const output = document.getElementById("output");
const outputStr = document.getElementById("outputStr");

//const urlbase = "https://nami0.github.io/4pro/facilitator.html";
const urlbase = "./facilitator.html";

//音声認識
const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const btnArea = document.querySelector('#btn-area');
const isRecognition = document.getElementById('isRecognition');
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
let n;
let cautionUser = [];
let cautionColorUser = [];
let cautionAudioUser = 0;
let cautionVolume = [];
firebase.database().ref(room).child("number").once("value",snapshot => {
    n = snapshot.val().number;
    getLatestData();
    writeHTML();
    for(let i=0; i<n; i++){
	cautionUser.push(false);
	cautionColorUser.push(false);
	cautionVolume.push(false);
    }
    database.ref(room+'/'+"caution").set({
	user: cautionUser,
	colorUser: cautionColorUser,
	audioUser: cautionAudioUser,
	volume: cautionVolume,
    });
});
let isLookSpeechVolume;
let isAutoCaution;
let isCautionAll;
let isText;
let isColor;
let isAudio;
let cautionRange;
firebase.database().ref(room).child("setting").once("value",snapshot => {
    let v = snapshot.val();
    isLookSpeechVolume = v.isLookSpeechVolume;
    isAutoCaution = v.isAutoCaution;
    isCautionAll = v.isCautionAll;
    isText = v.isText;
    isColor = v.isColor;
    isAudio = v.isAudio;
    cautionRange = v.cautionRange;
    writeSetting();
    if(!isAutoCaution){
	caution.innerHTML = '<select id="cautionName"></select> を <button id="caution_btn" class="btn btn-warning" onClick="cautionStart();">テキスト</button> <button id="cautionColor_btn" class="btn btn-warning" onClick="cautionColorStart();">カラー</button> <button id="cautionAudio_btn" class="btn btn-warning" onClick="cautionAudioStart();">音声</button> で注意する<br><select id="cautionStopName"></select> の <button id="cautionStop_btn" class="btn btn-success" onClick="cautionStop();">注意をやめる</button>';
	for(let i=1; i<=n; i++)
	    cautionBtnResult.innerHTML += '<div id="cautionBtnResult'+i+'"></div><div id="cautionBtnResult_color'+i+'"></div><div id="cautionBtnResult_audio'+i+'"></div>';
	cautionName = document.getElementById("cautionName");
	cautionStopName = document.getElementById("cautionStopName");
    } 
});

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
    isRecognition.innerHTML = "音声を認識中...";
    setSpeechVolume(finalTranscript);
    getLatestData();
    writeSpeechVolume(finalTranscript,interimTranscript);
}
recognition.onsoundstart = function(){
    isRecognition.innerHTML = "音声を認識中...";
}
recognition.onnomatch = function(){
    isRecognition.innerHTML = "もう一度試してください";
};
recognition.onerror= function(){
    isRecognition.innerHTML = "エラー";
};
recognition.onsoundend = function(){
    isRecognition.innerHTML = "停止中";
};

function start(){
    recognition.start();
}
function stop(){
    recognition.stop();
    btnArea.innerHTML = '音声認識　<button id="start-btn" class="btn btn-primary" data-bs-toggle="button" onClick="start();">開始</button> <button id="stop-btn" class="btn btn-primary" onClick="stop();">終了</button>';
}
//データベースからデータを削除
function resetData(){
    database.ref(room+'/'+"user"+user.value).set(null);
    finalTranscript = '';
    writeSpeechVolume(finalTranscript,'');
    getLatestData();
}
function cautionStart(){
    if(cautionName!=null){
	let i = cautionName.value;
	document.getElementById("cautionBtnResult"+i).innerHTML = setLabel(cautionName.value-1)+"さんにテキストで注意喚起しています！";
	cautionUser[i-1] = true;
	if(data2[cautionName.value-1].y>=Math.floor(100/n)){
	    cautionVolume[i-1] = "over";
	} else {
	    cautionVolume[i-1] = "under";
	}
    }
    console.log(cautionUser);
    database.ref(room+'/'+"caution").update({
	user: cautionUser,
	volume: cautionVolume,
    });
}
let alpha = [];
let alphaBack = [];
function cautionColorStart(){
    if(cautionName!=null){
	let i = cautionName.value;
	document.getElementById("cautionBtnResult_color"+i).innerHTML = setLabel(cautionName.value-1)+"さんにカラーで注意喚起しています！";
	cautionColorUser[i-1] = true;
	alpha[i] = 1;
	alphaBack[i] = 0;
	if(data2[cautionName.value-1].y>=Math.floor(100/n)){
	    cautionVolume[i-1] = "over";
	} else {
	    cautionVolume[i-1] = "under";
	}
    }
    database.ref(room+'/'+"caution").update({
	colorUser: cautionColorUser,
	volume: cautionVolume,
    });
}
let count=0;
function cautionAudioStart(){
    if(cautionName!=null){
	let i = cautionName.value;
	document.getElementById("cautionBtnResult_audio"+i).innerHTML = setLabel(cautionName.value-1)+"さんに音声で注意喚起しました！";
	count=0;
	cautionAudioUser = i;
	if(data2[cautionName.value-1].y>Math.floor(100/n)){
	    cautionVolume[i-1] = "over";
	} else {
	    cautionVolume[i-1] = "under";
	}
    }
    database.ref(room+'/'+"caution").update({
	audioUser: cautionAudioUser,
	volume: cautionVolume,
    });
}
function cautionStop(){
    if(cautionStopName!=null){
	let i = cautionStopName.value;
	document.getElementById("cautionBtnResult"+i).innerHTML = '';
	document.getElementById("cautionBtnResult_color"+i).innerHTML = '';
	document.getElementById("cautionBtnResult_audio"+i).innerHTML = '';
	alpha[i] = 1;
	alphaBack[i] = 0;
	cautionUser[i-1] = false;
	cautionColorUser[i-1] = false;
	if(i==cautionAudioUser) cautionAudioUser = 0;
    }
    database.ref(room+'/'+"caution").set({
	user: cautionUser,
	colorUser: cautionColorUser,
	audioUser: cautionAudioUser,
	volume: cautionVolume,
    });
}

//データベースに新しいデータをセット
function setSpeechVolume(finalTranscript){
    database.ref(room+'/'+"user"+user.value).set({
	name: setLabel(user.value-1),
	speechVolume: finalTranscript.length,
	script: finalTranscript,
	facilitator: true,
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
var ctx = document.getElementById('myChart').getContext('2d');
var ctx2 = document.getElementById('myChart2').getContext('2d');
var chart = new Chart(ctx, {
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
			writeStr();
			writeCaution();
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
			writeCaution();
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
let isBreak = false;
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
    if(!isBreak){
	writeCautionName();
    }
}
function writeCautionName(){
    let names='';
    for(let i=0; i<n; i++) {
	if(dataAll[i] != undefined && dataAll[i].name != ""){
	    names += '<option value='+(i+1)+'>'+setLabel(i)+'</option>';
	    isBreak = true;
	}
    }
    if(cautionName != null) cautionName.innerHTML = names;
    if(cautionStopName != null) cautionStopName.innerHTML = names;
}
function writeSetting(){
    if(isLookSpeechVolume == "all"){
	setting.innerHTML = "発言量の表示　 ： 全員　　<br>";
    } else if(isLookSpeechVolume == "one"){
	setting.innerHTML = "発言量の表示　 ： 個人　　<br>";
    } else {
	setting.innerHTML = "発言量の表示　 ： なし　　<br>"
    }
    if(isAutoCaution){
	setting.innerHTML += "注意喚起　　　 ： 自動　　<br>";
    } else {
	setting.innerHTML += "注意喚起　　　 ： 手動　　<br>";
    }
    if(isCautionAll){
	setting.innerHTML += "注意喚起の表示 ： 全員　　<br>";
    } else {
	setting.innerHTML += "注意喚起の表示 ： 個人　　<br>";
    }
    if(isAutoCaution){
	if(isText){
	    setting.innerHTML += "注意喚起の方法 ： テキスト<br>";
	} else if(isColor){
	    setting.innerHTML += "注意喚起の方法 ： カラー　<br>";
	} else if(isAudio){
	    setting.innerHTML += "注意喚起の方法 ： 音声　　<br>";
	}
    }
}
let myAlpha = 1;
let myAlphaBack = 0;
let audio1 = new Audio("./sounds/sound01.mp3");
let audio2 = new Audio("./sounds/sound02.mp3");
let count1 = 0;
let count2 = 0;
function writeCaution(){
    let allVolume = 0;
    for(let i=0; i<n; i++){
	if(dataAll[i] != null){
	    allVolume += dataAll[i].volume;
	}
    }
    if(isAutoCaution){
	cautionResult.innerHTML = "";
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
		    if(data2[user.value-1].y >= cautionRange[0]){
			cautionStrAuto(user.value,'over');
		    }
		    if(data2[user.value-1].y <= cautionRange[1]){
			cautionStrAuto(user.value,'under');
		    }
		}
	    }
	    if(isColor){
		if(data2[user.value-1].y >= cautionRange[0]){
		    allElements.style.color = "rgba(0,0,0,"+myAlpha+")";
		    myAlpha -= 0.005;
		} else {
		    myAlpha = 1;
		    allElements.style.color = "rgba(0,0,0,1)";
		}
		if(data2[user.value-1].y <= cautionRange[1]){
		    allElements.style.backgroundColor = "rgba(0,0,0,"+myAlphaBack+")";
		    myAlphaBack += 0.005;
		} else {
		    myAlphaBack = 0;
		    allElements.style.backgroundColor = "rgba(0,0,0,0)"
		}
	    }
	    if(isAudio){
		if(data2[user.value-1].y >= cautionRange[0]){
		    if(count1<=0){
			audio2.play();
			count1 = 0;
		    }
		    count1 += 1;
		    if(count1>100) count1=0;
		} else if(data2[user.value-1].y <= cautionRange[1]){
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
	if(count<5) count += 1;
	for(let i=1; i<=n; i++){
	    if(count>4){
		document.getElementById("cautionBtnResult_audio"+i).innerHTML = '';
	    }
	    if(cautionVolume[i-1] == "over"){
		if(document.getElementById("cautionBtnResult_color"+i)!=null){
		    document.getElementById("cautionBtnResult_color"+i).style.color = "rgba(255,0,0,"+alpha[i]+")";
		    if(alpha[i]<0.1) alpha[i] = 0.1;
		    else alpha[i] -= 0.005;
		}
	    } else{
		if(document.getElementById("cautionBtnResult_color"+i)!=null){
		    document.getElementById("cautionBtnResult_color"+i).style.backgroundColor = "rgba(0,0,0,"+alphaBack[i]+")";
		    alphaBack[i] += 0.005;
		}
	    }
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
    if (user !== undefined) {
        user.value = userID;
    }
    nameID = para["name"];
    if (name !== undefined) {
        name.value = nameID;
    }
    numberID = para["number"];
    if (number !== undefined) {
        number.value = numberID;
    }
}
