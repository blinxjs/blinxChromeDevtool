var panelElement;
var trussPanel;
var moduleObj;
var allModuleInstances;

//need to seperate listeners from this file
var REQ_IDS = {
    INIT: 0,
    SEND_LOG_TO_PANEL: 1,
    SEND_MODULES_ON_CREATE: 2,
    INIT_PANEL: 3,
    SEND_MODULES_ON_DESTROY: 4
};

var EVT_IDS = {
    TEST: 0,
    GET_MODULES: 1
};                

var backgroundPageConnection = chrome.runtime.connect({
    name: "BlinxPanel"
});

var sendMessageToContentScript = function(message){
    backgroundPageConnection.postMessage(message);
}

sendMessageToContentScript({
    name: 'INIT',
    tabId: chrome.devtools.inspectedWindow.tabId,
    message: 'tests'    
});


var createTrussPanel = new function(){
    // console.log("creating blinx panel");
    chrome.devtools.panels.create(
    "Blinx",'',
    "TrussPanel.html",                
    function(panel) {
        panel.onShown.addListener(function tempFunc(panel_window){
        
             panelElement = panel_window;
            /* Toggle between adding and removing the "active" and "show" classes when the user clicks on one of the "Section" buttons. The "active" class is used to add a background color to the current button when its belonging panel is open. The "show" class is used to open the specific accordion panel */            

            panelElement.document.getElementById("refreshBtn").addEventListener("click", function(){
                panelElement.document.getElementById("logText").innerText = "Checking For Blinx Modules in Page"; 
                sendMessageToContentScript({
                    name: 'GET_MODULES',
                    tabId: chrome.devtools.inspectedWindow.tabId
                });
            });    

        });
    });
}

var recieveMessage = function(message){
    switch(message.type){
        case "INIT":

            //this.createTrussPanel();
        break;        
        case "UPDATE_MODULES":
            panelElement.document.getElementById("logText").innerText = "Modules In Page: " + message.data.length; 
            updateModules(message.data);
        break;
        default:
            // console.log("Unknown Request Id");
        break;
    }

}

var sendMessage = function(message){
    backgroundPageConnection.postMessage(message);
}

backgroundPageConnection.onMessage.addListener(function (message) {    
    recieveMessage(message);
});

var clearModuleInfo = function(){
    var rootNode = panelElement.document.getElementById("moduleInfo");
    rootNode.innerHTML = "";
}

var updateModules = function(dataObject){
    clearModuleInfo();
    if(dataObject){
        sortModuleArrayToTree(dataObject);
        dataObject.forEach(function(moduleObject, index){
            var rootNode = panelElement.document.getElementById("moduleInfo"); 
            generateAndAppendModuleAccordian(rootNode, moduleObject, index);
        });
    }    
}

var sortModuleArrayToTree = function(objectToConvert){
    objectToConvert.forEach(function(moduleObject, index){
        moduleObject.subModules.forEach(function(subModuleObject, subModuleIndex){
            var instanceConfigToCheck = subModuleObject.moduleInstanceConfig;
            objectToConvert.forEach(function(moduleObjectToCheck, checkIndex){
                if(instanceConfigToCheck == moduleObjectToCheck.moduleInstanceConfig){
                    objectToConvert.splice(checkIndex, 1);
                }
            });
        });
    });
}

var generateAndAppendModuleAccordian = function(rootNode, moduleObject, index){    
       

    var accordianNode = document.createElement("button");
    accordianNode.className = "accordion";
    
    accordianNode.innerText = moduleObject.moduleName;  
    accordianNode.dataset.containerElement = moduleObject.moduleConfig.container

    var iconNode = document.createElement("span");
    iconNode.className = "collapse-icon";
    accordianNode.appendChild(iconNode);

    if(moduleObject.moduleConfig.placeholders){
        moduleObject.moduleConfig.placeholders = JSON.parse(moduleObject.moduleConfig.placeholders);
    }  

    var detailNode = document.createElement("div");
    detailNode.className = "panel";
    
    var subModules = document.createElement("p");

    moduleObject.subModules.forEach(function(subModuleObject, subModuleIndex){
        var rootNode = subModules;
        generateAndAppendModuleAccordian(rootNode, subModuleObject, subModuleIndex);
    })
    
    detailNode.appendChild(subModules);

    rootNode.appendChild(accordianNode);
    rootNode.appendChild(detailNode);        

    accordianNode.addEventListener("mouseover", function(event){
        // console.log("on hover target: "+event.target);
        sendMessageToContentScript({
            name: 'ADD_HOVER_HIGHLIGHT_DOM',            
            data: {'parent': event.target.dataset.containerElement, 'element': moduleObject.moduleName}
        });     
    })    

    accordianNode.addEventListener("mouseout", function(event){
        // console.log("on hover target: "+event.target);
        sendMessageToContentScript({
            name: 'REMOVE_HOVER_HIGHLIGHT_DOM',            
            data: {'parent': event.target.dataset.containerElement, 'element': moduleObject.moduleName}
        });     
    })    

    accordianNode.onclick = function(e){
        // console.log("on click target: "+e.target);
        this.classList.toggle("active");
        this.nextElementSibling.classList.toggle("show");

        sidebarTitle = panelElement.document.getElementById("sidebarHeader");
        sidebarTitle.innerText = "InstanceConfig: ";

        sideBarTextNode = panelElement.document.getElementById("sidebarText");
        sideBarTextNode.innerText = "";
        $(sideBarTextNode).jsonView(moduleObject.moduleConfig);        
        sendMessageToContentScript({
            name: 'SELECT_HIGHLIGHT_DOM',            
            data: {'parent': e.target.dataset.containerElement, 'element': moduleObject.moduleName}
        });         
    }

    // activateAccordians();
};


