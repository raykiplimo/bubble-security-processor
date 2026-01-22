
// Bubble.io Plugin Code

// Initialize function
function(instance, context) {
    instance.data.device = null;
    instance.data.server = null;
    instance.data.service = null;
    instance.data.characteristic = null;

    instance.data.log = function(msg) {
        console.log("BubbleBluetooth: " + msg);
        instance.triggerEvent("log", { message: msg });
        instance.publishState("last_log", msg);
    };
}

// Update function (usually empty for this kind of plugin unless inputs change)
function(instance, properties, context) {
    
}

// Action: Connect to Device
// Recommended actions fields: 
// - Service UUID (text)
function(instance, properties, context) {
    if (!navigator.bluetooth) {
        instance.data.log("Web Bluetooth API not available.");
        return;
    }

    let serviceUuid = properties.service_uuid; 
    let options = {
        acceptAllDevices: true
    };

    if (serviceUuid) {
        options = {
            filters: [{ services: [serviceUuid] }]
        };
    }
    
    // For wider compatibility in testing, sometimes acceptAllDevices is easier, 
    // but to access a service you often need to list it in optionalServices.
    if (properties.optional_services) {
         options.optionalServices = properties.optional_services.split(',').map(s => s.trim());
    }

    navigator.bluetooth.requestDevice(options)
    .then(device => {
        instance.data.device = device;
        instance.data.log("Device selected: " + device.name);
        instance.publishState("device_name", device.name);
        instance.publishState("is_connected", true); // Optimistic, effectively connected to handle
        
        device.addEventListener('gattserverdisconnected', function() {
             instance.data.log("Device disconnected");
             instance.publishState("is_connected", false);
             instance.triggerEvent("disconnected");
        });

        return device.gatt.connect();
    })
    .then(server => {
        instance.data.server = server;
        instance.data.log("Connected to GATT Server");
        instance.triggerEvent("connected");
    })
    .catch(error => {
        instance.data.log("Error: " + error);
        instance.triggerEvent("error", { error: error.toString() });
    });
}

// Action: Disconnect
function(instance, properties, context) {
    if (instance.data.device && instance.data.device.gatt.connected) {
        instance.data.device.gatt.disconnect();
        instance.data.log("User initiated disconnect");
    }
}

// Action: Read Value
// Fields: Service UUID, Characteristic UUID
function(instance, properties, context) {
   if (!instance.data.server) {
       instance.data.log("Not connected");
       return;
   }
   
   instance.data.server.getPrimaryService(properties.service_uuid)
   .then(service => service.getCharacteristic(properties.characteristic_uuid))
   .then(characteristic => characteristic.readValue())
   .then(value => {
       // Assuming text decoder for simplicity, but could be hex
       let decoder = new TextDecoder('utf-8');
       let text = decoder.decode(value);
       instance.publishState("read_value", text);
       instance.triggerEvent("value_read", { value: text });
       instance.data.log("Read value: " + text);
   })
   .catch(error => {
       instance.data.log("Read Error: " + error);
   });
}
