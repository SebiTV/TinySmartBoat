"use strict"

var connected_flag=0	
var reconnectTimeout = 2000;
var host=""; //Put your host idress here
var port=9001;
var row=0;
var out_msg="";
var mcount=0;
var state_obj;
var switches_obj;
var msg_state_switch = 0;
var user_name=document.forms["data"]["username"].value;
var password=document.forms["data"]["password"].value;
var switches = {
    "msgtime":0,
    "s1":false,
    "s1set":0, 
    "s1sot":30
    };
var x=Math.floor(Math.random() * 10000); 
var cname="orderform-"+x;
var rmCheck = document.getElementById("remember");
var mqtt = new Paho.MQTT.Client(host,port,cname);
mqtt.onConnectionLost = onConnectionLost;
mqtt.onMessageArrived = onMessageArrived;
document.getElementById("switch").style.display="none";
var ships = [];

function onConnectionLost(){
	console.log("connection lost");
	connected_flag = 0;
    document.getElementById("login").style.display="block";
    document.getElementById("switch").style.display="none";
}

function time_since_epoch(){
    console.log(Math.round(Date.now()));
    return Math.round(Date.now());
}

function onFailure(message) {
		console.log("Failed");
        setTimeout(MQTTconnect, reconnectTimeout);
}

function onStateMessage(stobj){
    var time_last_response_min = Math.floor((time_since_epoch()-stobj.msgtime)/60000);
    if(time_last_response_min > 60){
        var time_last_response_hour = Math.floor(time_last_response_min/60);
        time_last_response_min = Math.floor(time_last_response_min - (time_last_response_hour*60));
        if(time_last_response_hour > 24){
            //Darstellung als Datum noch machen

        }else{
            if(time_last_response_hour > 1){
                document.getElementById("last_response").innerHTML = "Last response: " + time_last_response_hour + " hours and " + time_last_response_min + " min";
            }else{
                document.getElementById("last_response").innerHTML = "Last response: " + time_last_response_hour + " hour and " + time_last_response_min + " min";
            }
        }
    }else{
        document.getElementById("last_response").innerHTML = "Last response: " + time_last_response_min + " min";
    }
    if(stobj.s1 && stobj.s1sot == 0){
        document.getElementById("man").style.display="block";
        document.getElementById("hourglas").style.display="none";
    }else if(stobj.s1 == false){
        document.getElementById("hourglas_time").innerHTML = "";
        document.getElementById("hourglas").style.display="none";
        document.getElementById("man").style.display="none";
    }else{
        var remaining_time = stobj.s1sot-Math.floor((time_since_epoch()-stobj.s1set)/60000)
        document.getElementById("hourglas_time").innerHTML = remaining_time + "min";
        document.getElementById("hourglas").style.display="block";
        document.getElementById("man").style.display="none";

    }
    document.getElementById("voltage").innerHTML = ": " + stobj.voltage + "V";
    if(stobj.wd1){
        document.getElementById("alert").style.display="block";
        document.getElementById("dry").style.display="none";
        document.getElementById("water").innerHTML = " Alert";
    }else{
        document.getElementById("dry").style.display ="block";
        document.getElementById("alert").style.display="none";
        document.getElementById("water").innerHTML = " Dry";
    }

    if(stobj.s1 == true){
        console.log("setze switch auf an");
        console.log(stobj);
        document.getElementById("fridgeswitch").checked = true;
    }else{
        console.log("setze switch auf aus");
        document.getElementById("fridgeswitch").checked = false;
    }
}


function switch_button(){
    var sot = Math.floor((time_since_epoch()-switches_obj.msgtime)/60000);
    sot = switches_obj.s1sot - sot;
    if(sot < 0){
        sot = 0;
    }
    console.log(sot);
    console.log("Switch_button");
    if(state_obj.msgtime < switches_obj.msgtime){
        console.log("True");
        document.getElementById("man").style.display = "none";
        if(document.getElementById("fridgeswitch").checked != switches_obj.s1set){
            console.log("switchbutton: " + switches_obj.s1set);
            document.getElementById("fridgeswitch").checked = switches_obj.s1set;
        }   
        if(document.getElementById("fridgeswitch").checked){
            document.getElementById("hourglas").style.display="block";
            document.getElementById("hourglas_time").style.display="block";
            document.getElementById("hourglas_time").innerHTML= sot + " min";
        }else{
            document.getElementById("hourglas").style.display="none"
            document.getElementById("hourglas_time").style.display="none";
        }
    }else{
        console.log("False");
        if(document.getElementById("fridgeswitch").checked && state_obj.s1sot > 0){

            console.log("Show Hourglass if fridgeswitch = true");
            document.getElementById("hourglas").style.display="block";
            document.getElementById("hourglas_time").style.display="block";
            document.getElementById("hourglas_time").innerHTML= sot + " min";
        }else{
            console.log("Hide Hourglass if fridgeswitch = false");
            document.getElementById("hourglas").style.display="none"
            document.getElementById("hourglas_time").style.display="none";
            
        }
        document.getElementById("fridgeswitch").checked = state_obj.s1;
        if(state_obj.s1sot == 0 && state_obj.s1 == true){
            console.log("switch hand show");
            document.getElementById("man").style.display = "block";
        }else{
            console.log("Switch hand hide");
            document.getElementById("man").style.display = "none";
        }
    }
    if(state_obj.s1 == true){
        document.getElementById("fridge").style.fill="green";
    }else{
        document.getElementById("fridge").style.fill="black";
    }
}

function getShipName(destName){
    var shipname = "Schiff11";
    var first = shipname.indexOf("/");
    var last = shipname.lastIndexOf("/");
    shipname = shipname.slice(first+1,last);
    return shipname;
}

function onMessageArrived(r_message){
    //Checks which type of topic it is but whith more then one ship it will not function
    //!!!!!!!!!!!!!!!!!!!!!!!
    console.log("Check Data");
    console.log(r_message.destinationName);
    var shipname = getShipName(r_message.destinationName);
    document.getElementById("shipname").innerHTML = shipname;
    if(ships.includes(shipname)){
        if(r_message.destinationName.includes("state")){
            ships[shipname].state_obj = JSON.parse(r_message.payloadString);
            onStateMessage(ships[shipname].state_obj);
        }
        if(r_message.destinationName.includes("switches")){
            ships[shipname].switches_obj = JSON.parse(r_message.payloadString);
        }
    }else{
        ships[shipname] = new ships_switches();
        ships[shipname].id = shipname;
        console.log(shipname);
        //ships[shipname].createDOM();
        console.log(r_message.payloadString)
        if(r_message.destinationName.includes("state") && r_message.destinationName.includes("schiff1")){
            ships[shipname].state_obj = JSON.parse(r_message.payloadString);
            onStateMessage(ships[shipname].state_obj);
           
        }
        if(r_message.destinationName.includes("switches")){
            ships[shipname].switches_obj = JSON.parse(r_message.payloadString);
        }
    }
    
    
    ships[shipname].updateData(r_message, r_message.destinationName);
    
}

function onConnect(){
	// Once a connection has been made, make a subscription and send a message.
	connected_flag=1;
    sub_topics();
    document.getElementById("login").style.display="none";
    document.getElementById("switch").style.display="block";
    console.log("Connected");
}

function disconnect(){
    console.log("disconnect");
	if (connected_flag==1)
		mqtt.disconnect();
        document.getElementById("login").style.display="block";
        document.getElementById("switch").style.display="none";
}

function fridgepub(){
    console.log("fridgehub");
    var togswitch = document.getElementById("fridgeswitch");
    var top = "tinysmartboat/schiff1/switches";
  
    switches.msgtime = time_since_epoch();
    switches.s1 = time_since_epoch();
    var time_fridge = document.getElementById("time_fridge");
    var value = time_fridge.value;
    
    //publish a switch message, with the actuale date and the fridge time and if the fridge should goes on or not
    console.log(switches);
    if(togswitch.checked){
        switches.s1set = true;
        switches.s1sot = Number(value);
         
        send_message(JSON.stringify(switches), top);
    }else{
        switches.s1set = false;
        
        send_message(JSON.stringify(switches), top);
    }
}


function MQTTconnect() {
    //Get a connection with the username and password. Without its not working.
	user_name=document.forms["data"]["username"].value;
	password=document.forms["data"]["password"].value;
	console.log("connecting to "+ host +" "+ port);
	var options = {
		onSuccess: onConnect,
		onFailure: onFailure,
        password: password,
        userName: user_name
    };
	mqtt.connect(options);
	return false;
}

function sub_topics(){
    console.log("sub");
    if (connected_flag==0){
        return false;
    }
    //subscribe to all topics witch are allowed for the user in the acl dynamic config
	mqtt.subscribe("#");
	return false;
}

function send_message(msg,topic){
    if (connected_flag==0){
        return false;
    }
    var message = new Paho.MQTT.Message(msg);
    message.destinationName = topic;
    message.qos=0;
    message.retained=true;
    mqtt.send(message);
    return false;
}

class ships_switches{
    //https://wesbos.com/template-strings-html
    constructor() {
        this.state_obj;
        this.switches_obj;
        this.id;
        this.datas_switches = {
            msgtime : 0,
            s1 : 0,
            s1set : false,
            s1sot : 60
        }
        this.datas_state = {
            msgtime : 0,
            s1 : 0,
            s1set : false,
            s1sot : 60,
            voltage : 0,
            wd1 : false
        }
    }
    updateData(obj, topic){
        if(topic.includes("switches")){
            this.datas_switches.msgtime = obj.msgtime;
            this.datas_switches.s1 = obj.s1; 
            this.datas_switches.s1set = obj.s1set;
            this.datas_switches.s1sot = obj.s1sot;
        }else{
            this.datas_state.msgtime = obj.msgtime;
            this.datas_state.s1 = obj.s1;
            this.datas_state.s1set = obj.s1set;
            this.datas_state.s1sot = obj.s1sot;
            this.datas_state.voltage = obj.voltage;
            this.datas_state.wd1 = obj.wd1;
        }
    }

    createNewShip(){
        console.log("create New Ship on the Website");
        
    }


    
    createDOM(){
        console.log("test");
        var switches_div = document.createElement('div');
        
        switches_div.setAttribute("id", "_switch");
        switches_div.setAttribute("class", "col-md-6 col-xs-12");

        var fridge_table = document.createElement('table');
        switches_div.appendChild(fridge_table);
        

        var fridge_symbol_td = document.createElement('td');
        var fridge_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var fridge_path = document.createElementNS('http://www.w3.org/2000/svg','path');
        fridge_svg.appendChild(fridge_path);
        fridge_symbol_td.appendChild(fridge_svg);
        fridge_svg.setAttribute("width","40");
        fridge_svg.setAttribute("height","40");
        fridge_svg.setAttribute("id", "_fridge");
        fridge_svg.setAttribute("fill", "currentColor");
        fridge_svg.setAttribute("class","bi bi-snow2");
        fridge_svg.setAttribute("viewBox", "0 0 16 16");
        fridge_path.setAttribute("d","M8 16a.5.5 0 0 1-.5-.5v-1.293l-.646.647a.5.5 0 0 1-.707-.708L7.5 12.793v-1.086l-.646.647a.5.5 0 0 1-.707-.708L7.5 10.293V8.866l-1.236.713-.495 1.85a.5.5 0 1 1-.966-.26l.237-.882-.94.542-.496 1.85a.5.5 0 1 1-.966-.26l.237-.882-1.12.646a.5.5 0 0 1-.5-.866l1.12-.646-.884-.237a.5.5 0 1 1 .26-.966l1.848.495.94-.542-.882-.237a.5.5 0 1 1 .258-.966l1.85.495L7 8l-1.236-.713-1.849.495a.5.5 0 1 1-.258-.966l.883-.237-.94-.542-1.85.495a.5.5 0 0 1-.258-.966l.883-.237-1.12-.646a.5.5 0 1 1 .5-.866l1.12.646-.237-.883a.5.5 0 0 1 .966-.258l.495 1.849.94.542-.236-.883a.5.5 0 0 1 .966-.258l.495 1.849 1.236.713V5.707L6.147 4.354a.5.5 0 1 1 .707-.708l.646.647V3.207L6.147 1.854a.5.5 0 1 1 .707-.708l.646.647V.5a.5.5 0 0 1 1 0v1.293l.647-.647a.5.5 0 1 1 .707.708L8.5 3.207v1.086l.647-.647a.5.5 0 1 1 .707.708L8.5 5.707v1.427l1.236-.713.495-1.85a.5.5 0 1 1 .966.26l-.236.882.94-.542.495-1.85a.5.5 0 1 1 .966.26l-.236.882 1.12-.646a.5.5 0 0 1 .5.866l-1.12.646.883.237a.5.5 0 1 1-.26.966l-1.848-.495-.94.542.883.237a.5.5 0 1 1-.26.966l-1.848-.495L9 8l1.236.713 1.849-.495a.5.5 0 0 1 .259.966l-.883.237.94.542 1.849-.495a.5.5 0 0 1 .259.966l-.883.237 1.12.646a.5.5 0 0 1-.5.866l-1.12-.646.236.883a.5.5 0 1 1-.966.258l-.495-1.849-.94-.542.236.883a.5.5 0 0 1-.966.258L9.736 9.58 8.5 8.866v1.427l1.354 1.353a.5.5 0 0 1-.707.708l-.647-.647v1.086l1.354 1.353a.5.5 0 0 1-.707.708l-.647-.647V15.5a.5.5 0 0 1-.5.5z");
        
        //let textNode = document.createTextNode("Hello World"); document.body.appendChild(textNode);
    }

}