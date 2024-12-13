const express = require('express');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

const mysql = require('mysql2');

// MySQL connection
const connection = mysql.createConnection({
  host: '18.220.128.209',
  user: 'star',
  password: 'capstone',
  database: 'mC_Connect',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

  // Load promotions from the database
  loadPromotions();
});

// Create canvas
const { createCanvas, loadImage, Image } = require('canvas');
const QRCode = require('qrcode');

// Middleware to parse incoming requests as JSON
app.use(express.json());

// Define a route to handle webhook events
app.post('/webhook', (req, res) => {
  const eventData = req.body;
  const eventTitle = eventData.title;

  // Log incoming event for debugging
  console.log('Received event:', eventData);

  // Process events based on the title
  switch (eventTitle) {
    case 'push-switch-on':
      handlePushSwitch(eventData);
      break;

    case 'image-updated':
      handleImageUpdated(eventData);
      break;

    case 'app-disconnection':
      handleAppDisconnection(eventData);
      break;

    case 'battery-capacity':
      handleBatteryCapacity(eventData);
      break;

    default:
      console.log('Unknown event title:', eventTitle);
      res.status(400).send('Unknown event type');
      return;
  }

  // Respond with a success message
  res.status(200).send('Webhook received');
});

// Handlers for each event type
function handlePushSwitch(data) {
  const { id, address, device_name, action } = data;
  console.log(`Push switch pressed on device ${device_name} (ID: ${id}, Address: ${address}) with action: ${action}`);
  if (Device.getDeviceById(id).active == true) {
    Device.getDeviceById(id).processButtonPress(action);
    //Device.getDeviceById(id).setActive(false);
  }
  // Add logic to handle each action type (e.g., single push, double push, etc.)
}

function handleImageUpdated(data) {
  const { id, address, device_name, job_id } = data;
  console.log(`Image updated for device ${device_name} (ID: ${id}, Address: ${address}), Job ID: ${job_id}`);
  Device.getDeviceById(id).setActive(true);
  // Add logic to process image updates, if needed
}

function handleAppDisconnection(data) {
  const { id, name, intentional } = data;
  console.log(`App disconnected: ${name} (ID: ${id}). Intentional: ${intentional}`);
  // Handle intentional vs. unintentional disconnections
}

function handleBatteryCapacity(data) {
  const { id, address, device_name, battery_level } = data;
  console.log(`Battery level for device ${device_name} (ID: ${id}, Address: ${address}): ${battery_level}`);
  // Handle battery level notification (e.g., send alert if below threshold)
}

let qrImage

function generateQR(value, size, callback) {
    QRCode.toDataURL(value, { width: size }, (err, url) => {
        if (err) return callback(err);
        var image = new Image();
        image.src = url;
        callback(null, image);
    });
}

generateQR("localhost:3001/order?table=1", 100, (err, image) => {
    if (err) {
        console.error('Error generating QR code:', err);
        return;
    }
    qrImage = image;
});

let payQRImage;

generateQR("localhost:3001/pay?table=1", 100, (err, image) => {
    if (err) {
        console.error('Error generating QR code:', err);
        return;
    }
    payQRImage = image;
});

/**
 * Represents a mc-Connect device.
 * @param {string} id The device's ID.
 * @param {Screen} screen The screen to display on the device.
 */
class Device {
  static devices = [];

  static getDeviceById(id) {
    return Device.devices.find(device => device.id === id);
  }

  static addDevice(device) {
    Device.devices.push(device);
  }

  constructor(id, screen) {
    this.id = id;
    this.screen = screen;
    this.active = true;
    this.timeout = null;
    this.balance = 0; // Initialize balance
    this.canvas = createCanvas(400, 300); // Create a canvas for this device
    this.ctx = this.canvas.getContext('2d'); // Get the context for this canvas
    Device.addDevice(this);
  }

  setScreen(screen) {
    this.screen = screen;
    console.log(this.screen);
    this.clearTimeout();
    if (this.screen.idle) {
      this.timeout = setTimeout(() => {
        if (this.active) {
          this.setScreen(this.screen.idle);
        }
      }, this.screen.idleTime * 1000);
    }
    this.updateBalance(() => {
      this.screen.generate(this.balance, this.canvas, this.ctx); // Pass canvas and context
      this.pushCanvasToDevice();
    });
  }

  clearTimeout() {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  processButtonPress(type) {
    if (this.active) {
      this.setScreen(this.screen.buttonPress(type));
    }
  }

  pushCanvasToDevice() {
    if (this.active) {
      const dataURL = this.canvas.toDataURL(); // Use the device's canvas
      pushToConnect([this.id], dataURL);
    }
  }

  setActive(active) {
    this.active = active;
  }

  // Add method to update balance from database
  updateBalance(callback) {
    connection.query('SELECT Balance FROM table_info WHERE DeviceID = ?', [this.id], (error, results) => {
      if (error) {
        console.error('Error fetching balance:', error);
        this.balance = 0;
      } else if (results.length > 0) {
        this.balance = parseFloat(results[0].Balance); // Convert Balance to a number
      } else {
        this.balance = 0;
      }
      callback();
    });
  }
}

/**
 * Represents a screen on a mc-Connect device.
 * @param {function} generateFunction The function to generate the screen.
 * @param {Screen} singlePress The screen to switch to on a single button press.
 * @param {Screen} longPress The screen to switch to on a long button press.
 * @param {Screen} idle The screen to switch to after a period of inactivity.
 * @param {number} idleTime The time in seconds before switching to the idle screen.
 */
class Screen {
  constructor(generateFunction, singlePress = null, longPress = null, idle = null, idleTime = 60) {
    this.generateFunction = generateFunction;
    this.singlePress = singlePress;
    this.longPress = longPress;
    this.idle = idle;
    this.idleTime = idleTime;
  }

  /**
   * Set the screen to switch to on a single button press.
   * @param {Screen} screen The screen to switch to.
   */
  setSingle(screen) {
    this.singlePress = screen;
  }

  /**
   * Set the screen to switch to on a long button press.
   * @param {Screen} screen The screen to switch to.
   */
  setHold(screen) {
    this.longPress = screen;
  }

  /**
   * Set the screen to switch to after a period of inactivity.
   * @param {Screen} screen The screen to switch to.
   */
  setIdle(screen) {
    this.idle = screen;
  }

  generate(balance, canvas, ctx) {
    this.generateFunction(balance, canvas, ctx);
  }

  buttonPress(type) {
    if (type === 1 && this.singlePress) {
      console.log("single press");
      return this.singlePress;
    } else if (type === 129 && this.longPress) {
      console.log("long press");
      return this.longPress;
    }
    console.log("no press");
    return this;
  }
}

/**
 * Draw the menu bar at the bottom of the canvas
 * @param {string} text Text to display on the menu bar.
 * @param {boolean} invert If true, the menu bar will be white.
 * @param {boolean} arrow If true, draw a downward-facing arrow on the right side of the menu bar.
 * @param {number} height Height of the menu bar.
 * @param {number} balance The balance to display at the top right.
 */
function drawMenuBar(text, invert = false, arrow = false, height = 100, balance = 0, canvas, ctx) {
  if (invert) {
    ctx.fillStyle = "#FFFFFF";
  } else {
    ctx.fillStyle = "#000000";
  }
  // draw bar
  ctx.fillRect(0, canvas.height - height, canvas.width, height);
  // arrow
  if (arrow) {
    if (invert) {
      ctx.strokeStyle = "#000000";
    } else {
      ctx.strokeStyle = "#FFFFFF";
    }
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 25, canvas.height - height / 2 + 10);
    ctx.lineTo(canvas.width - 37.5, canvas.height - height / 2 + 35);
    ctx.lineTo(canvas.width - 50, canvas.height - height / 2 + 10);
    ctx.moveTo(canvas.width - 37.5, canvas.height - height / 2 + 35);
    ctx.lineTo(canvas.width - 37.5, canvas.height - height / 2 - 15);
    ctx.stroke();
  }
  // draw menu bar
  if (invert) {
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = "#FFFFFF";
  }
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // wrap text and center vertically
  var words = text.split(' ');
  var line = '';
  var lineHeight = 28;
  var lines = [];
  var y = canvas.height - height / 2 + 10;

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > canvas.width - 50 && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  y -= (lines.length - 1) * lineHeight / 2;

  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvas.width / 2 - (arrow ? 25 : 0), y);
    y += lineHeight;
  }

  // Display balance in the top right corner
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`Balance: $${balance.toFixed(2)}`, canvas.width - 10, canvas.height - height + 10);
}

// Initialize promotions array
let promotions = [];
let promotionsIndex = 0;

// Load promotions from the Menu table
function loadPromotions() {
  connection.query('SELECT name, Price, description FROM Menu', (error, results) => {
    if (error) {
      console.error('Error fetching promotions:', error);
      return;
    }

    promotions = results.map(item => ({
      title: `${item.name} for $${item.Price}`,
      description: item.description
    }));
  });
}

function drawPromo(balance, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (promotions.length > 0) {
    const promotion = promotions[promotionsIndex];
    promotionsIndex = (promotionsIndex + 1) % promotions.length;

    // Draw promotion title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(promotion.title, canvas.width / 2, 100);

    // Draw promotion description
    ctx.font = '20px sans-serif';
    ctx.fillText(promotion.description, canvas.width / 2, 140);
  } else {
    // If no promotions are available, display a default message
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No promotions available', canvas.width / 2, 120);
  }

  drawMenuBar("Press button to view menu", false, true, 100, balance, canvas, ctx);
}

// Modify drawMenu to accept balance and pass it to drawMenuBar
function drawMenu(qrImage, balance, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw "SCAN FOR"
  ctx.fillStyle = 'black';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN FOR', canvas.width / 2, 30); // Draw at top of QR Code

  // Draw the QR code
  const qrTopPosition = 50; // Adjust this value to fit within 200px
  const qrHeight = 100; // Assuming the QR code height is 100px
  ctx.drawImage(qrImage, (canvas.width - 100) / 2, qrTopPosition);

  // Draw "MENU" text below the QR code
  const menuTextPosition = qrTopPosition + qrHeight + 20; // Adjust this value to fit within 200px
  ctx.fillText('MENU', canvas.width / 2, menuTextPosition);

  drawMenuBar("Press to pay, or hold for help", false, true, 100, balance, canvas, ctx);
}

// Modify drawPay to accept balance and pass it to drawMenuBar
function drawPay(qrImage, balance, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw "SCAN FOR"
  ctx.fillStyle = 'black';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN FOR', canvas.width / 2, 30); // Draw at top of QR Code

  // Draw the QR code
  const qrTopPosition = 50; // Adjust this value to fit within 200px
  const qrHeight = 100; // Assuming the QR code height is 100px
  ctx.drawImage(qrImage, (canvas.width - 100) / 2, qrTopPosition);

  // Draw "PAY" text below the QR code
  const payTextPosition = qrTopPosition + qrHeight + 20; // Adjust this value to fit within 200px
  ctx.fillText('PAY', canvas.width / 2, payTextPosition);

  drawMenuBar("Press for menu, or hold for help", false, true, 100, balance, canvas, ctx);
}

// Modify drawHelp to accept balance and pass it to drawMenuBar
function drawHelp(balance, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.font = '29px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Help has been requested', (canvas.width) / 2, 73);

  ctx.fillText('A member of our staff will be with you shortly', (canvas.width) / 2 - 0, 145, 390);

  drawMenuBar("Hold button to cancel help request", false, true, 100, balance, canvas, ctx);
}

let customerFacingDevices = [];

// Populate customerFacingDevices based on DeviceIDs and TableIDs
connection.query('SELECT DeviceID, TableID FROM table_info', (error, results) => {
  if (error) {
    console.error('Error fetching device and table IDs:', error);
    return;
  }

  results.forEach(row => {
    const deviceId = row.DeviceID;
    const tableId = row.TableID;

    // Generate QR codes for menu and pay
    generateQR(`localhost:3001/order?table=${tableId}`, 100, (err, menuQRImage) => {
      if (err) {
        console.error('Error generating menu QR code:', err);
        return;
      }

      generateQR(`localhost:3001/pay?table=${tableId}`, 100, (err, payQRImage) => {
        if (err) {
          console.error('Error generating pay QR code:', err);
          return;
        }

        // Create custom screens with the generated QR codes
        const promoScreen = new Screen((balance, canvas, ctx) => drawPromo(balance, canvas, ctx), null, null, null, 20);
        const menuScreen = new Screen((balance, canvas, ctx) => drawMenu(menuQRImage, balance, canvas, ctx), null, null, promoScreen, 40);
        const payScreen = new Screen((balance, canvas, ctx) => drawPay(payQRImage, balance, canvas, ctx), null, null, promoScreen, 40);
        const helpScreen = new Screen((balance, canvas, ctx) => drawHelp(balance, canvas, ctx), null, null, null, 0);

        promoScreen.setSingle(menuScreen);
        promoScreen.setIdle(promoScreen);
        menuScreen.setSingle(payScreen);
        menuScreen.setHold(helpScreen);
        payScreen.setSingle(menuScreen);
        payScreen.setHold(helpScreen);
        helpScreen.setHold(menuScreen);

        const device = new Device(deviceId, promoScreen);
        customerFacingDevices.push(device);
        device.processButtonPress(5);
      });
    });
  });
});

// button interact 
function generateBase64() {
  var dataURL = canvas.toDataURL();
  console.log(dataURL);
}

// Modify pushToConnect function to accept dataURL as a parameter
function pushToConnect(device_ids, dataURL, led = 2) {
  var data = JSON.stringify({
    "device_ids": device_ids,
    "led": led,
    "buzzer": {
      "on_time": 150,
      "off_time": 250,
      "repetitions": 0
    },
    "content": dataURL,
  });

  var options = {
    hostname: 'mc-connect-manager.smcs.io',
    path: '/api/v1/update-image',
    method: 'PUT',
    headers: {
      'Star-Api-Key': '932c3c5e-ba74-490d-8a34-03eddb410a59',
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  var req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      console.log(responseData);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});