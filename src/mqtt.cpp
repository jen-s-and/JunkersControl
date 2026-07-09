#include <Arduino.h>
#include <mqtt.h>
#include <configuration.h>
#include <main.h>
#include <telnet.h>
#include <heating.h>
#include <ArduinoJson.h>
#include <ha_autodiscovery.h>

//——————————————————————————————————————————————————————————————————————————————
//  MQTT Client (uses Wifi Client)
//——————————————————————————————————————————————————————————————————————————————
PubSubClient client(espClient);

CommandedValues commandedValues;
ShowerBoostState showerBoostState;
String TopicBuf;
String PayloadBuf;
static const char *ShowerBoostSetTopic = "cerasmarter/shower_boost/set";
static const char *ShowerBoostStatusTopic = "cerasmarter/shower_boost/status";
static const int ShowerBoostMinTemperature = 10;
static const int ShowerBoostMaxTemperature = 60;
static const int ShowerBoostDefaultTemperature = 50;
static const int ShowerBoostDefaultRestoreTemperature = 10;
static const int ShowerBoostMaxDuration = 3600;
static const int ShowerBoostCommandIntervalMs = 5000;

// \brief (Re)connect to MQTT broker
void reconnectMqtt()
{
  if (!WiFi.isConnected())
  {
    Log.println("Can't connect to MQTT broker. [No Network]");
    return;
  }

  // Loop until we're reconnected
  while (!client.connected())
  {

    Log.print("Attempting MQTT connection...");

    String clientId = generateClientId();
    // Attempt to connect
    if (client.connect(clientId.c_str(), configuration.Mqtt.User, configuration.Mqtt.Password))
    {
      Log.println("connected");

      // Subscribe to parameters.
      client.subscribe(configuration.Mqtt.Topics.HeatingParameters);
      client.subscribe(configuration.Mqtt.Topics.WaterParameters);
      client.subscribe(configuration.Mqtt.Topics.StatusRequest);
      client.subscribe(configuration.Mqtt.Topics.Boost);
      client.subscribe(configuration.Mqtt.Topics.FastHeatup);
      client.subscribe(ShowerBoostSetTopic);
      if (configuration.HomeAssistant.Enabled)
      {
        SetupAutodiscovery(HaSensorsFileName);
        SetupAutodiscovery(HaBinarySensorsFileName);
        SetupAutodiscovery(HaNumbersFileName);
      }
    }
    else
    {
      Log.print("failed, rc=");
      Log.print(client.state());
      Log.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// Returns a client id for MQTT communication
String generateClientId()
{
  String macAddress = WiFi.macAddress();
  macAddress.replace(":", "");
  // Create client ID using MAC address
  String clientId = "ESP-";
  clientId += macAddress;

  return clientId;
}

void setupMqttClient()
{
  // Setup MQTT client
  client.setServer(configuration.Mqtt.Server, configuration.Mqtt.Port);
  client.setCallback(callback);
  client.setKeepAlive(10);
}

String boolToString(bool src)
{
  return (src) ? "true" : "false";
}
static void ClearShowerBoostError()
{
  showerBoostState.Error = false;
  showerBoostState.LastError[0] = '\0';
}

static void SetShowerBoostError(const char *message)
{
  showerBoostState.Error = true;
  strlcpy(showerBoostState.LastError, message, sizeof(showerBoostState.LastError));
  PublishLog(message, __func__, LogLevel::Warn);
}

static int ClampInt(int value, int minValue, int maxValue)
{
  if (value < minValue)
  {
    return minValue;
  }

  if (value > maxValue)
  {
    return maxValue;
  }

  return value;
}

static void StartShowerBoost(int targetTemperature, int durationSeconds, int restoreTemperature)
{
  ClearShowerBoostError();
  showerBoostState.Active = true;
  showerBoostState.RestorePending = false;
  showerBoostState.RestoreCommandSent = false;
  showerBoostState.RefreshRequested = true;
  showerBoostState.TargetTemperature = targetTemperature;
  showerBoostState.RestoreTemperature = restoreTemperature;
  showerBoostState.DurationSeconds = durationSeconds;
  showerBoostState.RemainingSeconds = durationSeconds;
  showerBoostState.PreviousSetpoint = (int)round(ceraValues.Hotwater.SetPoint);
  showerBoostState.LastCommandMillis = 0L;
  PublishLog("Shower boost started", __func__, LogLevel::Info);
}

void PublishShowerBoostStatus()
{
  if (!client.connected())
  {
    return;
  }

  StaticJsonDocument<384> doc;
  doc["active"] = boolToString(showerBoostState.Active);
  doc["restore_pending"] = boolToString(showerBoostState.RestorePending);
  doc["restore_command_sent"] = boolToString(showerBoostState.RestoreCommandSent);
  doc["target_temperature"] = showerBoostState.TargetTemperature;
  doc["restore_temperature"] = showerBoostState.RestoreTemperature;
  doc["duration"] = showerBoostState.DurationSeconds;
  doc["remaining"] = showerBoostState.RemainingSeconds;
  doc["previous_setpoint"] = showerBoostState.PreviousSetpoint;
  doc["current_setpoint"] = ceraValues.Hotwater.SetPoint;
  doc["maximum_temperature"] = ceraValues.Hotwater.MaximumTemperature;
  doc["error"] = showerBoostState.LastError;

  char buffer[512];
  size_t n = serializeJson(doc, buffer);
  client.publish(ShowerBoostStatusTopic, buffer, n);
}

void TickShowerBoost()
{
  if (!showerBoostState.Active)
  {
    return;
  }

  if (showerBoostState.RemainingSeconds > 0)
  {
    showerBoostState.RemainingSeconds--;
  }

  if (showerBoostState.RemainingSeconds == 0)
  {
    showerBoostState.Active = false;
    showerBoostState.RestorePending = true;
    showerBoostState.RestoreCommandSent = false;
    showerBoostState.LastCommandMillis = 0L;
    PublishLog("Shower boost expired; restoring hot water setpoint", __func__, LogLevel::Info);
  }
}

void DriveShowerBoost()
{
  if (!showerBoostState.Active && !showerBoostState.RestorePending)
  {
    return;
  }

  const int currentSetpoint = (int)round(ceraValues.Hotwater.SetPoint);
  const int desiredSetpoint = showerBoostState.Active ? showerBoostState.TargetTemperature : showerBoostState.RestoreTemperature;

  if (showerBoostState.RestorePending && showerBoostState.RestoreCommandSent && currentSetpoint == desiredSetpoint)
  {
    showerBoostState.RestorePending = false;
    ClearShowerBoostError();
    PublishLog("Shower boost restore completed", __func__, LogLevel::Info);
    return;
  }

  if (showerBoostState.Active && currentSetpoint == desiredSetpoint && !showerBoostState.RefreshRequested)
  {
    return;
  }

  const unsigned long now = millis();
  if (now - lastSentMessageTime < 1000 ||
      (!showerBoostState.RefreshRequested && now - showerBoostState.LastCommandMillis < ShowerBoostCommandIntervalMs))
  {
    return;
  }

  if (!SendHotWaterSetpointMessage(desiredSetpoint))
  {
    SetShowerBoostError("Shower boost could not send hot water setpoint");
    return;
  }

  ClearShowerBoostError();
  showerBoostState.LastCommandMillis = now;
  showerBoostState.RefreshRequested = false;
  if (showerBoostState.RestorePending)
  {
    showerBoostState.RestoreCommandSent = true;
  }
}

void RequestShowerBoostSetpointRefresh(int observedTemperature)
{
  if (showerBoostState.Active && observedTemperature != showerBoostState.TargetTemperature)
  {
    showerBoostState.RefreshRequested = true;
  }
}

// Callback for MQTT subscribed topics
void callback(char *topic, byte *payload, unsigned int length)
{
  ShowActivityLed();
  payload[length] = '\0';
  String payloadBuf = String((char *)payload);
  if (!payloadBuf)
  {
    return;
  }
  
  /*
  NOTE: This is supposed to be in the HA branch.
  */
  //TopicBuf = topic;
//
  //// Command Topics for HA auto discovery.
  //if (TopicBuf.endsWith(F("/set")))
  //{
  //  WriteToConsoles("Received SET Topic: ");
  //  WriteToConsoles(TopicBuf);
  //  WriteToConsoles("\r\n");
  //  // Remove prefixes
  //  TopicBuf.replace(configuration.HomeAssistant.AutoDiscoveryPrefix + "/","");
  //  TopicBuf.replace(configuration.HomeAssistant.DeviceId + "/","");
  //  // Try to get the category
  //  String category = TopicBuf.substring(0,TopicBuf.indexOf('/'));
  //  category.replace("/","");
  //  // Remove Category from string
  //  TopicBuf.replace(category,"");
  //  TopicBuf.replace(F("/set"),"");
  //  String parameterName = TopicBuf.substring(TopicBuf.lastIndexOf('/'),TopicBuf.length());
  //  parameterName.replace(F("/"),"");
//
  //  WriteToConsoles("Received Values for Category: ");
  //  WriteToConsoles(category);
  //  WriteToConsoles(" Parameter Name: ");
  //  WriteToConsoles(parameterName);
  //  WriteToConsoles(" Payload: ");
  //  WriteToConsoles(PayloadBuf);
  //  WriteToConsoles("\r\n");
  //  
  //  // Setting Values coming from HA.
  //  // NOTE: This is all hardcoded on purpose as we have no means of determining which variable is targeted
  //  if(category == "Heating")
  //  {
  //    if(parameterName == "BoostDuration")
  //    {
//
  //    }
  //  }
  //}
  

  // Status Requested
  if (strcmp(topic, configuration.Mqtt.Topics.StatusRequest) == 0)
  {
    StaticJsonDocument<256> doc;

    DeserializationError error = deserializeJson(doc, (char *)payload, length);

    if (error)
    {
      Log.printf("[Status Request] Error Processing JSON: %payloadBuf\r\n", error.c_str());
      return;
    }
    /* Example JSON:
        {
            "HeatingTemperatures": true,
            "WaterTemperatures": true,
            "AuxiliaryTemperatures": true,
            "Status": true
        }
    */

    bool HeatingTemperatures = false;
    bool WaterTemperatures = false;
    bool AuxiliaryTemperatures = false;
    bool Status = false;

    if (!doc["HeatingTemperatures"].isNull())
      HeatingTemperatures = doc["HeatingTemperatures"]; // false
    if (!doc["WaterTemperatures"].isNull())
      WaterTemperatures = doc["WaterTemperatures"]; // false
    if (!doc["AuxiliaryTemperatures"].isNull())
      AuxiliaryTemperatures = doc["AuxiliaryTemperatures"]; // true
    if (!doc["Status"].isNull())
      Status = doc["Status"]; // false

    if (HeatingTemperatures)
    {
      PublishHeatingTemperaturesAndStatus();
    }

    if (WaterTemperatures)
    {
      PublishWaterTemperatures();
    }

    if (AuxiliaryTemperatures)
    {
      PublishAuxiliaryTemperatures();
    }

    if (Status)
    {
      PublishStatus();
    }
  }

  // Receiving Heating Parameters
  if (strcmp(topic, configuration.Mqtt.Topics.HeatingParameters) == 0)
  {
    /*
    Example Json:
    {
      "Enabled": false,
      "FeedSetpoint": 0,
      "FeedBaseSetpoint": -10,
      "FeedCutOff": 22,
      "FeedMinimum": 10,
      "AuxiliaryTemperature": 11.6,
      "AmbientTemperature": 0,
      "TargetAmbientTemperature": 21,
      "OnDemandBoost": false,
      "OnDemandBoostDuration": 600,
      "FastHeatup": false,
      "Adaption": 0,
      "ValveScaling": true,
      "ValveScalingMaxOpening": 100,
      "ValveScalingOpening": 75,
      "DynamicAdaption": true,
      "OverrideSetpoint": false
    }
    */

    const int docSize = 384;
    StaticJsonDocument<docSize> doc;
    DeserializationError error = deserializeJson(doc, (char *)payload, length);

    if (error)
    {
      Log.printf("[Heating Parameters] Error Processing JSON: %payloadBuf\r\n", error.c_str());
      return;
    }

    // Request Enable/Disable Heating and set the status of the heating accordingly
    if (!doc["Enabled"].isNull())
      commandedValues.Heating.Active = doc["Enabled"];
    if (!doc["FeedSetpoint"].isNull())
      commandedValues.Heating.FeedSetpoint = doc["FeedSetpoint"];
    if (!doc["FeedBaseSetpoint"].isNull())
      commandedValues.Heating.BasepointTemperature = doc["FeedBaseSetpoint"];
    if (!doc["FeedCutOff"].isNull())
      commandedValues.Heating.EndpointTemperature = doc["FeedCutOff"];
    if (!doc["FeedMinimum"].isNull())
      commandedValues.Heating.MinimumFeedTemperature = doc["FeedMinimum"];
    if (!doc["AuxiliaryTemperature"].isNull())
      commandedValues.Heating.AuxiliaryTemperature = doc["AuxiliaryTemperature"];
    if (!doc["AmbientTemperature"].isNull())
      commandedValues.Heating.AmbientTemperature = doc["AmbientTemperature"];
    if (!doc["TargetAmbientTemperature"].isNull())
      commandedValues.Heating.TargetAmbientTemperature = doc["TargetAmbientTemperature"];
    if (!doc["Adaption"].isNull())
      commandedValues.Heating.FeedAdaption = doc["Adaption"];
    if (!doc["ValveScaling"].isNull())
      commandedValues.Heating.ValveScaling = doc["ValveScaling"];
    if (!doc["ValveScalingMaxOpening"].isNull())
      commandedValues.Heating.MaxValveOpening = doc["ValveScalingMaxOpening"];
    if (!doc["ValveScalingOpening"].isNull())
      commandedValues.Heating.ValveOpening = doc["ValveScalingOpening"];
    if (!doc["DynamicAdaption"].isNull())
      commandedValues.Heating.DynamicAdaption = doc["DynamicAdaption"];
    if (!doc["OverrideSetpoint"].isNull())
      commandedValues.Heating.OverrideSetpoint = doc["OverrideSetpoint"];
    if (!doc["OnDemandBoostDuration"].isNull())
      commandedValues.Heating.BoostDuration = doc["OnDemandBoostDuration"];
  }

  // Receiving Water Parameters
  if (strcmp(topic, configuration.Mqtt.Topics.WaterParameters) == 0)
  {
    /*
    Example Json:
    {
      "Setpoint": 10
    }
    */

    const int docSize = 16;
    StaticJsonDocument<docSize> doc;
    DeserializationError error = deserializeJson(doc, (char *)payload, length);

    if (error)
    {
      Log.printf("[Water Parameters] Error Processing JSON: %payloadBuf\r\n", error.c_str());
      return;
    }

    if (!doc["Setpoint"].isNull())
    {
      commandedValues.HotWater.SetPoint = doc["Setpoint"]; // 22.1
      commandedValues.HotWater.SetPointReceived = true;
    }
  }

  if (strcmp(topic, ShowerBoostSetTopic) == 0)
  {
#if READ_ONLY == 1 && ALLOW_SHOWER_BOOST_WRITE != 1
    SetShowerBoostError("Build blocks shower boost CAN writes");
    PublishShowerBoostStatus();
    return;
#endif

    const int docSize = 192;
    StaticJsonDocument<docSize> doc;
    DeserializationError error = deserializeJson(doc, (char *)payload, length);

    if (error)
    {
      SetShowerBoostError("Invalid shower boost JSON");
      PublishShowerBoostStatus();
      return;
    }

    if (!doc["cancel"].isNull() && doc["cancel"].as<bool>())
    {
      ClearShowerBoostError();
      showerBoostState.Active = false;
      showerBoostState.RestorePending = true;
      showerBoostState.RestoreCommandSent = false;
      showerBoostState.RefreshRequested = false;
      showerBoostState.RemainingSeconds = 0;
      showerBoostState.LastCommandMillis = 0L;
      PublishLog("Shower boost cancelled; restoring hot water setpoint", __func__, LogLevel::Info);
      PublishShowerBoostStatus();
      return;
    }

    const int targetTemperature = ClampInt(doc["target_temperature"] | ShowerBoostDefaultTemperature, ShowerBoostMinTemperature, ShowerBoostMaxTemperature);
    const int durationSeconds = ClampInt(doc["duration"] | ShowerBoostMaxDuration, 1, ShowerBoostMaxDuration);
    const int restoreTemperature = ClampInt(doc["restore_temperature"] | ShowerBoostDefaultRestoreTemperature, 10, ShowerBoostMaxTemperature);
    const int maximumTemperature = (int)round(ceraValues.Hotwater.MaximumTemperature);

    // This installation reports a physical maximum of 59 °C although the
    // controller's nominal upper selection is 60 °C. Permit that one-degree
    // representation difference, but continue rejecting larger requests.
    if (maximumTemperature > 0 && targetTemperature > maximumTemperature + 1)
    {
      SetShowerBoostError("Target temperature exceeds observed hot water maximum");
      PublishShowerBoostStatus();
      return;
    }

    StartShowerBoost(targetTemperature, durationSeconds, restoreTemperature);
    PublishShowerBoostStatus();
  }
  // On-Demand Boost
  if (strcmp(topic, configuration.Mqtt.Topics.Boost) == 0)
  {
    int i = payloadBuf.toInt();
    commandedValues.Heating.Boost = i == 1;
    commandedValues.Heating.BoostTimeCountdown = commandedValues.Heating.BoostDuration;
    SetFeedTemperature();
  }

  // Fast Heatup
  if (strcmp(topic, configuration.Mqtt.Topics.FastHeatup) == 0)
  {
    int i = payloadBuf.toInt();
    commandedValues.Heating.FastHeatup = i == 1;
    commandedValues.Heating.ReferenceAmbientTemperature = commandedValues.Heating.AmbientTemperature;
    SetFeedTemperature();
  }
}

void PublishStatus()
{
  ShowActivityLed();
  /* Example JSON
  {
      "GasBurner": true,
      "Error": 0..255,
  }
  */
  StaticJsonDocument<384> doc;
  JsonObject jsonObj = doc.to<JsonObject>();

  // Create a parent block for HA
  if (configuration.HomeAssistant.Enabled)
  {
    jsonObj = doc.createNestedObject("General");
  }

  jsonObj["GasBurner"] = boolToString(ceraValues.General.FlameLit);
  jsonObj["Error"] = ceraValues.General.Error;

  // Mute Flag Set. Don't send message.
  if (MUTE_MQTT == 1)
    return;

  // Publish Data on MQTT
  char buffer[768];
  size_t n = serializeJson(doc, buffer);

  // Send to HA state topic or the configured topic, when HA is disabled.
  if (configuration.HomeAssistant.Enabled)
  {
    String topic = configuration.HomeAssistant.StateTopic + "General/state";
    client.publish(topic.c_str(), buffer, n);
  }
  else
  {
    client.publish(configuration.Mqtt.Topics.Status, buffer, n);
  }
}

void PublishHeatingTemperaturesAndStatus()
{
  ShowActivityLed();
  /* Example JSON
  {
      "FeedMaximum": 75.10,
      "FeedCurrent": 30.10,
      "FeedSetpoint": 10.10,
      "Outside": 15.10,
      "Season": true,
      "Working": true,
      "Boost": true,
      "BoostTimeLeft": 600,
      "FastHeatup": true
  }
  */

  StaticJsonDocument<384> doc;
  JsonObject jsonObj = doc.to<JsonObject>();

  // Create a parent block for HA
  if (configuration.HomeAssistant.Enabled)
  {
    jsonObj = doc.createNestedObject("Heating");
  }

  jsonObj["FeedMaximum"] = ceraValues.Heating.FeedMaximum;
  jsonObj["FeedCurrent"] = ceraValues.Heating.FeedCurrent;
#if READ_ONLY == 1
  // A passive monitor must always report the setpoint observed on CAN.
  jsonObj["FeedSetpoint"] = ceraValues.Heating.FeedSetpoint;
#else
  jsonObj["FeedSetpoint"] = (OverrideControl) ? commandedValues.Heating.CalculatedFeedSetpoint : ceraValues.Heating.FeedSetpoint;
#endif
  jsonObj["Outside"] = ceraValues.General.OutsideTemperature;
  jsonObj["Pump"] = boolToString(ceraValues.Heating.PumpActive);
  jsonObj["Season"] = boolToString(ceraValues.Heating.Season);
  jsonObj["Working"] = boolToString(ceraValues.Heating.Active);
  jsonObj["Boost"] = boolToString(commandedValues.Heating.Boost);
  jsonObj["BoostTimeLeft"] = commandedValues.Heating.BoostTimeCountdown;
  jsonObj["FastHeatup"] = boolToString(commandedValues.Heating.FastHeatup);

  // Mute Flag Set. Don't send message.
  if (MUTE_MQTT == 1)
    return;

  // Publish Data on MQTT
  char buffer[768];
  size_t n = serializeJson(doc, buffer);

  // Send to HA state topic or the configured topic, when HA is disabled.
  if (configuration.HomeAssistant.Enabled)
  {
    String topic = configuration.HomeAssistant.StateTopic + "Heating/state";
    client.publish(topic.c_str(), buffer, n);
  }
  else
  {
    client.publish(configuration.Mqtt.Topics.HeatingValues, buffer, n);
  }
}

void PublishWaterTemperatures()
{
  ShowActivityLed();
  // TODO: Gather HW temperatures
  /* Example JSON
    {
      "Maximum": 75.10,
      "Current": 30.10,
      "Setpoint": 10.10,
      "CFSetpoint": 20.00,
      "Now": true,
      "Buffer": false
    }
  */

  StaticJsonDocument<384> doc;
  JsonObject jsonObj = doc.to<JsonObject>();

  // Create a parent block for HA
  if (configuration.HomeAssistant.Enabled)
  {
    jsonObj = doc.createNestedObject("Water");
  }

  jsonObj["Maximum"] = ceraValues.Hotwater.MaximumTemperature;
  jsonObj["Current"] = ceraValues.Hotwater.TemperatureCurrent;
  const double effectiveSetpoint = showerBoostState.Active
                                       ? showerBoostState.TargetTemperature
                                       : (showerBoostState.RestorePending
                                              ? showerBoostState.RestoreTemperature
                                              : ceraValues.Hotwater.SetPoint);
  jsonObj["Setpoint"] = effectiveSetpoint;
  jsonObj["ControllerSetpoint"] = ceraValues.Hotwater.SetPoint;
  jsonObj["CFSetpoint"] = ceraValues.Hotwater.ContinousFlowSetpoint;
  jsonObj["Now"] = boolToString(ceraValues.Hotwater.Now);
  jsonObj["Buffer"] = boolToString(ceraValues.Hotwater.BufferMode);

  // Mute Flag Set. Don't send message.
  if (MUTE_MQTT == 1)
    return;

  // Publish Data on MQTT
  char buffer[768];
  size_t n = serializeJson(doc, buffer);

  // Send to HA state topic or the configured topic, when HA is disabled.
  if (configuration.HomeAssistant.Enabled)
  {
    String topic = configuration.HomeAssistant.StateTopic + "Water/state";
    client.publish(topic.c_str(), buffer, n);
  }
  else
  {

    client.publish(configuration.Mqtt.Topics.WaterValues, buffer, n);
  }
}

void PublishAuxiliaryTemperatures()
{
  ShowActivityLed();
  /*
  {
      "Feed": 30.10,
      "Return": 30.10,
      "Exhaust": 50.10,
      "Ambient": 17.10
  }
  */

  StaticJsonDocument<384> doc;
  JsonObject jsonObj = doc.to<JsonObject>();

  // Create a parent block for HA
  if (configuration.HomeAssistant.Enabled)
  {
    jsonObj = doc.createNestedObject("Auxiliary");
  }

  for (size_t i = 0; i < configuration.TemperatureSensors.SensorCount; i++)
  {
    Sensor curSensor = configuration.TemperatureSensors.Sensors[i];
    JsonObject sensorVal = jsonObj.createNestedObject(curSensor.Label);
    sensorVal["Temperature"] = ceraValues.Auxiliary.Temperatures[i];
    sensorVal["Reachable"] = boolToString(curSensor.reachable);
  }

  // Mute Flag Set. Don't send message.
  if (MUTE_MQTT == 1)
    return;

  // Publish Data on MQTT
  char buffer[768];
  size_t n = serializeJson(doc, buffer);

  // Send to HA state topic or the configured topic, when HA is disabled.
  if (configuration.HomeAssistant.Enabled)
  {
    String topic = configuration.HomeAssistant.StateTopic + "Auxiliary/state";
    client.publish(topic.c_str(), buffer, n);
  }
  else
  {
    client.publish(configuration.Mqtt.Topics.AuxiliaryValues, buffer, n);
  }
}

void PublishLog(const char *msg, const char *func, LogLevel level)
{
  const size_t size = 1024;
  StaticJsonDocument<size> doc;
  JsonObject root = doc.to<JsonObject>();
  root["lvl"] = level;
  root["fnc"] = func;
  root["msg"] = msg;
  char buf[size];

  size_t n = serializeJson(doc, buf);

  client.publish("cerasmarter/log", buf, n);
}

void ShowActivityLed()
{
  if (MqttActivityHandle == NULL)
  {
    xTaskCreate(ShowMqttActivity, "MQTT Activity", 2000, NULL, 1, &MqttActivityHandle);
  }
}




