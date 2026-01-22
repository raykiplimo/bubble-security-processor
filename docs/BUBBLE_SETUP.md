# Bubble.io Bluetooth Plugin Setup Guide

This guide explains how to integrate the Bluetooth functionality into your Bubble application using the experimental plugin editor.

## Prerequisites
- A Bubble.io application.
- Target device (phone/laptop) must support Bluetooth LE.
- Browser must be Chrome, Edge, or Bluefy (on iOS). **HTTPS is required**.

## Step 1: Create a Plugin
1. Go to your Bubble app or the **Plugin Editor**.
2. Click **Create a Plugin**.
3. Name it "Easy Bluetooth" (or similar).

## Step 2: Configure the Element
1. Go to the **Elements** tab in the plugin editor.
2. Add a new element named `BluetoothConnector`.
3. Set verify to "Client-side" (this runs in the browser).
4. **Action:** Copy content from `src/bubble_bluetooth.js` section by section.

### Initialize
Copy the `function(instance, context) { ... }` block from the file.

### Actions
Add a new action called `Connect`.
- **Fields**:
    - `service_uuid` (text, optional) - The UUID of the service you want to filter for.
    - `optional_services` (text, optional) - Comma separated list of service UUIDs you might access.
- **Code**: Copy the `// Action: Connect to Device` function body.

Add a new action called `Disconnect`.
- **Code**: Copy the `// Action: Disconnect` function body.

Add a new action called `Read Value`.
- **Fields**: 
    - `service_uuid` (text)
    - `characteristic_uuid` (text)
- **Code**: Copy the `// Action: Read Value` function body.

## Step 3: Define States and Events
In the **States** section of the element:
- `device_name` (text)
- `is_connected` (yes/no)
- `last_log` (text)
- `read_value` (text)

In the **Events** section of the element:
- `connected`
- `disconnected`
- `error`
- `log`
- `value_read`

## Step 4: Testing
1. Integration: Add the `BluetoothConnector` element to a page in your Bubble app.
2. Workflow: Add a button "Scan", workflow -> Element Actions -> Connect.
3. Preview and test in a browser that supports Web Bluetooth.
