var REQ_IDS = {
    INIT_PANEL: 0,
    UPDATE_MODULES: 1,
    SEND_MODULES_ON_CREATE: 2,
    
    SEND_MODULES_ON_DESTROY: 4
};

//need to seperate dom manipulation into view file
var EVT_IDS = {
    TEST: 0,
    GET_MODULES: 1
};

//to devtools
var requestDevTools = function(reqId, data){
	switch(reqId){
    case REQ_IDS.INIT:
        chrome.runtime.sendMessage({ type: "INIT", text: data});
    break;
    case REQ_IDS.INIT_PANEL:
        //console.log("requesting init from devtools");        
        chrome.runtime.sendMessage({ type: "INIT", text: data});        
    break;
		case REQ_IDS.UPDATE_MODULES:
        //console.log("logging")
   			chrome.runtime.sendMessage({ type: "UPDATE_MODULES", data: data});
		break;
    case REQ_IDS.SEND_MODULES_TO_PANEL:
        chrome.runtime.sendMessage({ type: "GET_MODULES", text: data});     
    break;
		default:
			// console.log("Unknown Request Id");
		break;
	}
}

//from devtools panel
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var port = chrome.runtime.connect();

  //console.log("event from devtools: "+JSON.stringify(request));  
  if (sender && (request.type == "INIT")) {
      requestDevTools(REQ_IDS.INIT_PANEL);    
  }

  if (sender && (request.type == "GET_MODULES")) {   
      // console.log("sending event to blinx: devtools module state");
      sendEventToCore(EVT_IDS.GET_MODULES);
  }

  if(sender && (request.type == "ADD_HOVER_HIGHLIGHT_DOM")){      
      this.tempHighlightDom(request.message.data);
  }

  if(sender && (request.type == "REMOVE_HOVER_HIGHLIGHT_DOM")){      
      this.removeHighlight("temp");
  }

  if(sender && (request.type == "SELECT_HIGHLIGHT_DOM")){      
      this.persistHighlightDom(request.message.data);    
  }  

}, false);


var sendEventToCore = function(eventId) {
  var message;
  switch(eventId){
    case EVT_IDS.TEST:
        message = {"eventId" : "TEST", "data" : "test"};
    break;
    case EVT_IDS.GET_MODULES:
        message = {"eventId" : "GET_MODULES", "data" : ""};
    break;
    default:
        // console.log("Unknown event ID in content script");
    break;
  }

  var event = new CustomEvent("content-script-to-blinx", { bubbles: true, detail: message });
  document.dispatchEvent(event);
}


//from core
document.addEventListener("blinx-to-content-script", function(event){  
    switch(event.detail.eventId){
      case "GET_MODULES_REPONSE":
        requestDevTools(REQ_IDS.UPDATE_MODULES,event.detail.data);
      break;    
    }
})


//from core(background.js)
window.addEventListener("message", function(event) {
  var port = chrome.runtime.connect();

  //console.log("event from blinx: "+JSON.stringify(event));

  if (event.source !== window)
    return;

  if (event.data.type && (event.data.type == "test")) {
    //console.log("event from blinx: "+event);
  }
  
  if (event.data.type && (event.data.type == "LOG_EVENT")) {
    requestDevTools(REQ_IDS.SEND_LOG_TO_PANEL, event.data.text);
  }

  if (event.data.type && (event.data.type == "STORE_MODULES")) {
    requestDevTools(REQ_IDS.SEND_MODULES_TO_PANEL, event.data.text);
  }

}, false);

var tempHighlightedElement = null;
var permHighlightedElement = null;

var tempHighlightDom = function(data){
  var highlightParent = document.querySelectorAll(data.parent)[0];
  var domToHighlight = highlightParent.querySelectorAll("[class^="+data.element+"]")[0];  
  
  if(tempHighlightedElement){
      var domToRemove = tempHighlightedElement;
      removeHighlight("temp");    
      applyHighlight(domToHighlight, data.element, "temp");
      tempHighlightedElement = domToHighlight;
  }
  else if(tempHighlightedElement != domToHighlight){
      applyHighlight(domToHighlight, data.element, "temp");
      tempHighlightedElement = domToHighlight;
  }
}

var persistHighlightDom = function(data){
  var highlightParent = document.querySelectorAll(data.parent)[0];
  var domToHighlight = highlightParent.querySelectorAll("[class^="+data.element+"]")[0];  
  
  if(permHighlightedElement)  
    removeHighlight();
  if(domToHighlight){
    applyHighlight(domToHighlight, data.element);
    permHighlightedElement = domToHighlight;
  }  
}

var removeHighlight = function(type){
  if(type === "temp"){
    var highlightElement = tempHighlightedElement.parentElement.querySelectorAll("[id='temp_highlight']")[0]
  }
  else{
    var highlightElement = permHighlightedElement.parentElement.querySelectorAll("[id='highlight']")[0]
  }  
  if(highlightElement)
    highlightElement.parentElement.removeChild(highlightElement); 
}

var applyHighlight = function(domToHighlight, name, type){
  if(domToHighlight){
    var highlightDiv = document.createElement('div');

    var toolTip = document.createElement('p');
    toolTip.innerText = name;  
    highlightDiv.appendChild(toolTip);
    
    if(domToHighlight.offsetWidth)
    highlightDiv.style.width = domToHighlight.offsetWidth + 'px';
    if(domToHighlight.offsetHeight)
    highlightDiv.style.height = domToHighlight.offsetHeight + 'px';  

    highlightDiv.style.backgroundColor = "rgba(0, 0, 0, 0.2)";  
    highlightDiv.style.position = 'absolute';

    if(type && (type === "temp")){
      highlightDiv.id = "temp_highlight";
      highlightDiv.style.border = "4px solid skyblue";
      toolTip.style.cssText = "color: gray;width: initial;background: skyblue;"
    }
    else{
      highlightDiv.id = "highlight";
      highlightDiv.style.border = "4px solid #ffd824"
      toolTip.style.cssText = "color: gray;width: initial;background: #ffd824;"
    }

    domToHighlight.parentElement.appendChild(highlightDiv);

    highlightDiv.style.left = domToHighlight.offsetLeft + (domToHighlight.offsetWidth - highlightDiv.offsetWidth) / 2 + 'px';
    highlightDiv.style.top = domToHighlight.offsetTop + (domToHighlight.offsetHeight - highlightDiv.offsetHeight) / 2 + 'px';
  }    
}



