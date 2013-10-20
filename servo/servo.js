var connectionId = -1;

//-------------------------------------------------------------
//FUNCIONES PARA ABRIR PUERTO SERIE
//al cambiar el port-picker se llama a serial open con su identificador
function openSelectedPort() {
  var portPicker = document.getElementById('port-picker');
  var selectedPort = portPicker.options[portPicker.selectedIndex].value;
  chrome.serial.open(selectedPort, onOpen);
  updateConsole(selectedPort, false);
}

//Abrimos el puerto serie seleccionado, leemos un byte y leemos el valor del potenciómetro a onRead
function onOpen(openInfo) {
  connectionId = openInfo.connectionId;
  if (connectionId == -1) {
    setStatus('Could not open');
    return;
  }
  setStatus('Connected');

  //setPosition(0);
  chrome.serial.read(connectionId, 1, onRead);
  updateConsole("ok", true);
};


//Leemos del puerto serie posición de potenciómetro y giramos la imagen de chrome
function onRead(readInfo) {
  var uint8View = new Uint8Array(readInfo.data);
  var value = uint8View[0] - '0'.charCodeAt(0);
  var rotation = value * 18.0;

  document.getElementById('image').style.webkitTransform =
    'rotateZ(' + rotation + 'deg)';

  // Keep on reading.
  chrome.serial.read(connectionId, 1, onRead);
};

//-------------------------------------------------------------

//ESTADO DE LA CONEXIÓN SERIE
function setStatus(status) {
  document.getElementById('status').innerText = status;
}

//-------------------------------------------------------------


//MOSTRAMOS PUERTOS DISPONIBLES, SI EL USUARIO CAMBIA EL PUERTO SELECCIONADO SE CIERRA EL ANTERIOR Y SE ABRE EL NUEVO

function buildPortPicker(ports) {
  var eligiblePorts = ports.filter(function(port) {
    return !port.match(/[Bb]luetooth/);
  });

  var portPicker = document.getElementById('port-picker');
  eligiblePorts.forEach(function(port) {
    var portOption = document.createElement('option');
    portOption.value = portOption.innerText = port;
    portPicker.appendChild(portOption);
  });

  portPicker.onchange = function() {
    if (connectionId != -1) {
      chrome.serial.close(connectionId, openSelectedPort);
      return;
    }
    openSelectedPort();
  };
}

//-------------------------------------------------------------



var dataRead='';

var onCharRead=function(readInfo) {
    if (!connectionInfo) {
      return;
    }
    if (readInfo && readInfo.bytesRead>0 && readInfo.data) {
      var str=ab2str(readInfo.data);
      if (str[readInfo.bytesRead-1]==='\n') {
        dataRead+=str.substring(0, readInfo.bytesRead-1);
        onLineRead(dataRead);
        dataRead="";
      } else {
        dataRead+=str;
      }
    }
    chrome.serial.read(connectionId, 128, onCharRead);
 }

/* Convert an ArrayBuffer to a String, using UTF-8 as the encoding scheme.
   This is consistent with how Arduino sends characters by default */
var ab2str=function(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
};




var writeSerial=function(str) {
  updateConsole(str, false);
  chrome.serial.write(connectionId, str2ab(str), onWrite);
  updateConsole(str2ab(tr), true);
}
// Convert string to ArrayBuffer
var str2ab=function(str) {
  var buf=new ArrayBuffer(str.length);
  var bufView=new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i]=str.charCodeAt(i);
  }
  return buf;
}

var onWrite=function(obj) {
  //updateConsole(connectionId, false);
}


//IMPRIMIMOS EN TEXTAREA
function updateConsole(str, n) { //n=false para borrar el contenido
  var logarea = document.querySelector('textarea');
  if (n) {
    logarea.value=logarea.value+str+"\n";
    return;  
  }
  logarea.value=str+"\n";
}


//COMUNICACIÓN CON LA PÁGINA
onload = function() {
  //var tv = document.getElementById('tv');
  //navigator.webkitGetUserMedia(
  //    {video: true},
  //    function(stream) {
  //      tv.classList.add('working');
  //      document.getElementById('camera-output').src =
  //          webkitURL.createObjectURL(stream);
  //    },
  //    function() {
  //      tv.classList.add('broken');
  //    });


  //var output = document.getElementById('output');
  var input = document.getElementById('myText');
  var form = document.querySelector('form');

  form.addEventListener('submit', function(ev) {
    var newValue=input.value;
    updateConsole("k "+newValue,false);
    ev.preventDefault();
  });


  document.getElementById('servo-1').onchange = function() {
    document.getElementById('value-servo-1').innerHTML = this.value;
    var command ="r 1 "+ this.value + " 200";
    writeSerial(command);
   // setPosition(parseInt(this.value, 10));  
  };

  document.getElementById('servo-2').onchange = function() {
    document.getElementById('value-servo-2').innerHTML = this.value;
    var command ="r 2 "+ this.value + " 200";
    writeSerial(command);
    //setPosition(parseInt(this.value, 10));
  };

  chrome.serial.getPorts(function(ports) {
    buildPortPicker(ports)
    openSelectedPort();
  });
};
