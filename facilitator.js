var database = firebase.database();
let room = "speech_room";
const setting = document.getElementById("setting");
const number = document.getElementById("number");
const user = document.getElementById("user");
const name = document.getElementById("name");
const reset = document.getElementById("reset");
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
firebase.database().ref(room).child("number").on("value",snapshot => {
    n = snapshot.val().number;
    getLatestData();
    writeHTML();
});
let isLookMySpeechVolume;
let isLookAllSpeechVolume;
let isAutoCaution;
let isCautionAll;
let cautionRange;
firebase.database().ref(room).child("setting").on("value",snapshot => {
    let v = snapshot.val();
    isLookMySpeechVolume = v.isLookMySpeechVolume;
    isLookAllSpeechVolume = v.isLookAllSpeechVolume;
    isAutoCaution = v.isAutoCaution;
    isCautionAll = v.isCautionAll;
    cautionRange = v.cautionRange;
    writeSetting();
    if(!isAutoCaution){
	caution.innerHTML = '<select id="cautionName"></select>を<button id="caution_btn" onClick="cautionStart();">テキスト</button><button id="cautionColor_btn" onClick="cautionColorStart();">カラー</button>で注意する<br><select id="cautionStopName"></select>の<button id="cautionStop_btn" onClick="cautionStop();">注意をやめる</button>';
	for(let i=1; i<=n; i++)
	    cautionBtnResult.innerHTML += '<div id="cautionBtnResult'+i+'"></div>';
	cautionName = document.getElementById("cautionName");
	cautionStopName = document.getElementById("cautionStopName");
    } 
});
let cautionUser = [];
let cautionColorUser = [];
let cautionVolume = [];

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

function start(){
    recognition.start();
}
function stop(){
    recognition.stop();
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
	for(let i=1; i<=n; i++){
	    if(cautionName.value == i){
		document.getElementById("cautionBtnResult"+i).innerHTML = setLabel(cautionName.value-1)+"さんにテキストで注意喚起しています！";
		cautionUser[i-1] = true;
		if(data2[cautionName.value-1].y>=Math.floor(100/n)){
		    cautionVolume[i-1] = "over";
		} else {
		    cautionVolume[i-1] = "under";
		}
	    }
	}
	database.ref(room+'/'+"caution").set({
	    user: cautionUser,
	    colorUser: cautionColorUser,
	    volume: cautionVolume,
	});
    }
}
let alpha = [];
let alphaBack = [];
function cautionColorStart(){
    if(cautionName!=null){
	for(let i=1; i<=n; i++){
	    if(cautionName.value == i){
		document.getElementById("cautionBtnResult"+i).innerHTML = setLabel(cautionName.value-1)+"さんにカラーで注意喚起しています！";
		cautionColorUser[i-1] = true;
		alpha[i] = 1;
		alphaBack[i] = 0;
		if(data2[cautionName.value-1].y>=Math.floor(100/n)){
		    cautionVolume[i-1] = "over";
		} else {
		    cautionVolume[i-1] = "under";
		}
	    }
	}
	database.ref(room+'/'+"caution").set({
	    user: cautionUser,
	    colorUser: cautionColorUser,
	    volume: cautionVolume,
	});
    }
}
function cautionStop(){
    if(cautionStopName!=null){
	for(let i=1; i<=n; i++){
	    if(cautionStopName.value == i){
		document.getElementById("cautionBtnResult"+i).innerHTML = '';
		alpha[i] = 1;
		alphaBack[i] = 0;
		cautionUser[i-1] = false;
		cautionColorUser[i-1] = false;
	    }
	}
	database.ref(room+'/'+"caution").set({
	    user: cautionUser,
	    colorUser: cautionColorUser,
	    volume: cautionVolume,
	});
    }
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
    resultDiv2.innerHTML = finalTranscript.length; // 文字数
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
    if(isLookAllSpeechVolume){
	setting.innerHTML = "・全員の発言量が見える<br>";
    } else if(isLookMySpeechVolume){
	setting.innerHTML = "・自分の発言量だけが見える<br>";
    } else {
	setting.innerHTML = "・発言量は見えない<br>"
    }
    if(isAutoCaution){
	setting.innerHTML += "・注意喚起は自動で行われる<br>";
    } else {
	setting.innerHTML += "・注意喚起は手動で行われる<br>";
    }
    if(isCautionAll){
	setting.innerHTML += "・注意喚起は全員に伝えられる<br>";
    } else {
	setting.innerHTML += "・注意喚起は個人にのみ伝えられる<br>";
    }
}
function writeCaution(){
    let allVolume = 0;
    for(let i=0; i<n; i++){
	if(dataAll[i] != null){
	    allVolume += dataAll[i].volume;
	}
    }
    if(isAutoCaution){
	if(allVolume>100){
	    cautionResult.innerHTML = "";
	    for(let i=0; i<n; i++){
		if(data2[i].y >= cautionRange[0]){
		    cautionStrAuto(i+1,'over');
		}
		if(data2[i].y <= cautionRange[1]){
		    cautionStrAuto(i+1,'under');
		}
	    }
	}
    } else {
	
	for(let i=1; i<=n; i++){
	    if(cautionVolume[i-1] == "over"){
		if(document.getElementById("cautionBtnResult"+i)!=null){
		    document.getElementById("cautionBtnResult"+i).style.color = "rgba(255,0,0,"+alpha[i]+")";
		    if(alpha[i]<0.1) alpha[i] = 0.1;
		    else alpha[i] -= 0.005;
		}
	    } else{
		if(document.getElementById("cautionBtnResult"+i)!=null){
		    document.getElementById("cautionBtnResult"+i).style.backgroundColor = "rgba(0,0,0,"+alphaBack[i]+")";
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
