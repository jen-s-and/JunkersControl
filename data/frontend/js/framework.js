function _(el) {
    return document.getElementById(el);
}

const ThemeStorageKey = "cerasmarter-theme";
const LanguageStorageKey = "cerasmarter-language";

const CerasmarterTranslations = {
    en: {
        "nav.home": "Home",
        "nav.heating": "Heating",
        "nav.fileManager": "File Manager",
        "nav.firmware": "Firmware Update",
        "nav.configuration": "Configuration",
        "nav.wifi": "Wifi",
        "nav.mqtt": "MQTT",
        "nav.general": "General Settings",
        "nav.canbus": "CAN-Bus",
        "nav.sensors": "Temperature Sensors",
        "nav.leds": "LEDs",
        "nav.utilities": "Utilities",
        "nav.canAnalyzer": "CAN Message Analyzer",
        "nav.language": "Language",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "common.saveSettings": "Save Settings",
        "common.connected": "Connected",
        "common.disconnected": "Disconnected",
        "common.usedOf": "{used} of {total} used",
        "common.on": "On",
        "common.off": "Off",
        "common.active": "Active",
        "common.inactive": "Inactive",
        "common.raw": "raw",
        "common.noFrame": "No frame yet",
        "common.received": "Received",
        "common.sent": "Sent",
        "common.at": "at",
        "common.decodeError": "Decode error",
        "home.systemStatus": "System Status",
        "home.model": "Model",
        "home.revision": "Revision",
        "home.cores": "Cores",
        "home.ram": "RAM",
        "home.flash": "Flash",
        "home.canModule": "CAN-Bus Module",
        "home.canErrors": "CAN-Bus Errors",
        "home.mqttStatus": "MQTT Status",
        "home.reboot": "Reboot",
        "home.invokingReboot": "Invoking reboot ...",
        "general.title": "General Settings",
        "general.heatingValues": "Enable processing and transmission of heating values",
        "general.waterValues": "Enable processing and transmission of water values",
        "general.auxValues": "Enable processing and transmission of external temperature sensors",
        "general.overrideOutside": "Use your own outside temperature reference instead of the boiler sensor.",
        "general.overrideOutsideHelp": "Uses AuxiliaryTemperature from the heating parameters topic instead of the boiler outside sensor.",
        "general.timezone": "Timezone (NTP)",
        "general.messageTimeout": "Message Timeout",
        "general.messageTimeoutHelp": "Seconds before control over the heating is assumed when no other controller is detected on the bus.",
        "general.debug": "Enable debug messages on the consoles",
        "general.sniffing": "Output received CAN messages on the consoles.",
        "general.noTimezoneSupport": "Your browser does not support Intl.supportedValuesOf().",
        "can.options": "Options and Utilities",
        "can.ignoreKnown": "Ignore known addresses",
        "can.knownAddresses": "Known addresses",
        "can.unknownAddresses": "Unknown addresses",
        "can.title": "CAN Analyzer",
        "can.subtitle": "Live view of raw frames and translated heating parameters",
        "can.viewAria": "Analyzer view",
        "can.translated": "Translated",
        "can.rawData": "Raw data",
        "can.group.general": "General",
        "can.group.heating": "Heating",
        "can.group.hotWater": "Hot water",
        "can.group.mixedCircuit": "Mixed circuit",
        "can.group.controller": "Controller",
        "can.group.ta250": "TA250",
        "can.label.flameStatus": "Burner flame",
        "can.label.error": "Error code",
        "can.label.dateTime": "Controller time",
        "can.label.feedCurrent": "Flow current",
        "can.label.feedMax": "Flow maximum",
        "can.label.feedSetpoint": "Flow setpoint",
        "can.label.outsideTemperature": "Outside temperature",
        "can.label.heatingPump": "Heating pump",
        "can.label.season": "Season mode",
        "can.label.operation": "Heating operation",
        "can.label.power": "Heating power",
        "can.label.mode": "Control mode",
        "can.label.economy": "Economy mode",
        "can.label.hotWaterSetpoint": "Hot water setpoint",
        "can.label.hotWaterMax": "Hot water maximum",
        "can.label.hotWaterCurrent": "Hot water current",
        "can.label.hotWaterNow": "Hot water now",
        "can.label.bufferOperation": "Cylinder operation",
        "can.label.continuousFlowSetpoint": "Flow heater setpoint",
        "can.label.mixedPump": "Mixed circuit pump",
        "can.label.mixedFeedSetpoint": "Mixed circuit flow setpoint",
        "can.label.mixedFeedCurrent": "Mixed circuit flow current",
        "can.label.mixedEconomy": "Mixed circuit economy mode",
        "can.label.powerRating": "Power rating",
        "can.label.ta250Heartbeat": "TA250 heartbeat",
        "can.label.unknownStatus208": "Unknown status flag",
        "can.value.weatherCompensated": "Weather-compensated",
        "can.value.roomControlled": "Room-controlled",
        "can.value.winter": "Winter",
        "can.value.summer": "Summer",
        "can.value.heartbeat": "Heartbeat",
        "can.value.noError": "No error",
        "can.value.canInterrupted": "A8 - CAN communication interrupted",
        "can.value.day": "Day {day}",
        "can.value.monday": "Monday",
        "can.value.tuesday": "Tuesday",
        "can.value.wednesday": "Wednesday",
        "can.value.thursday": "Thursday",
        "can.value.friday": "Friday",
        "can.value.saturday": "Saturday",
        "can.value.sunday": "Sunday",
        "heating.title": "Heating Status",
        "heating.subtitle": "Active ESP parameters, live values and calculated heating curve.",
        "heating.curve": "Heating curve",
        "heating.effectiveState": "Effective state",
        "heating.receivedParameters": "Received parameters",
        "heating.boilerBusCurrent": "Boiler / bus current",
        "heating.mqttConnected": "MQTT connected",
        "heating.mqttDisconnected": "MQTT disconnected",
        "heating.statusUnavailable": "Status unavailable",
        "heating.active": "active",
        "heating.ready": "ready",
        "heating.seasonOn": "heating season on",
        "heating.seasonOff": "heating season off",
        "heating.calculatedAt": "{feed} at {outside} outside",
        "heating.enabled": "Heating enabled",
        "heating.blocked": "Heating blocked",
        "heating.allowed": "ESP may send according to heating curve.",
        "heating.blocked.seasonOff": "Heating season is off.",
        "heating.blocked.notRequested": "Heating curve is inactive or outside is above the heating limit.",
        "heating.requested": "Requested",
        "heating.seasonAllowed": "Season allowed",
        "heating.feedEffective": "CAN 0x252 effective",
        "heating.feed": "Flow",
        "heating.outside": "Outside",
        "bool.on": "On",
        "bool.off": "Off"
    },
    de: {
        "nav.home": "Start",
        "nav.heating": "Heizung",
        "nav.fileManager": "Dateimanager",
        "nav.firmware": "Firmware-Update",
        "nav.configuration": "Konfiguration",
        "nav.wifi": "WLAN",
        "nav.mqtt": "MQTT",
        "nav.general": "Allgemein",
        "nav.canbus": "CAN-Bus",
        "nav.sensors": "Temperatursensoren",
        "nav.leds": "LEDs",
        "nav.utilities": "Werkzeuge",
        "nav.canAnalyzer": "CAN-Analyzer",
        "nav.language": "Sprache",
        "theme.light": "Hell",
        "theme.dark": "Dunkel",
        "common.saveSettings": "Einstellungen speichern",
        "common.connected": "Verbunden",
        "common.disconnected": "Getrennt",
        "common.usedOf": "{used} von {total} belegt",
        "common.on": "Ein",
        "common.off": "Aus",
        "common.active": "Aktiv",
        "common.inactive": "Inaktiv",
        "common.raw": "Rohwert",
        "common.noFrame": "Noch kein Frame",
        "common.received": "Empfangen",
        "common.sent": "Gesendet",
        "common.at": "um",
        "common.decodeError": "Dekodierfehler",
        "home.systemStatus": "Systemstatus",
        "home.model": "Modell",
        "home.revision": "Revision",
        "home.cores": "Kerne",
        "home.ram": "RAM",
        "home.flash": "Flash",
        "home.canModule": "CAN-Bus-Modul",
        "home.canErrors": "CAN-Bus-Fehler",
        "home.mqttStatus": "MQTT-Status",
        "home.reboot": "Neustart",
        "home.invokingReboot": "Neustart wird ausgelöst ...",
        "general.title": "Allgemeine Einstellungen",
        "general.heatingValues": "Heizwerte verarbeiten und senden",
        "general.waterValues": "Warmwasserwerte verarbeiten und senden",
        "general.auxValues": "Externe Temperatursensoren verarbeiten und senden",
        "general.overrideOutside": "Eigene Außenreferenz statt Kesselfühler verwenden.",
        "general.overrideOutsideHelp": "Verwendet AuxiliaryTemperature aus dem Heizungsparameter-Topic statt des Außenfühlers der Heizung.",
        "general.timezone": "Zeitzone (NTP)",
        "general.messageTimeout": "Nachrichten-Timeout",
        "general.messageTimeoutHelp": "Sekunden, bis die Steuerung übernommen wird, wenn kein anderer Regler auf dem Bus erkannt wurde.",
        "general.debug": "Debugmeldungen auf den Konsolen ausgeben",
        "general.sniffing": "Empfangene CAN-Nachrichten auf den Konsolen ausgeben.",
        "general.noTimezoneSupport": "Dein Browser unterstützt Intl.supportedValuesOf() nicht.",
        "can.options": "Optionen und Werkzeuge",
        "can.ignoreKnown": "Bekannte Adressen ausblenden",
        "can.knownAddresses": "Bekannte Adressen",
        "can.unknownAddresses": "Unbekannte Adressen",
        "can.title": "CAN-Analyzer",
        "can.subtitle": "Liveansicht von Rohframes und übersetzten Heizungsparametern",
        "can.viewAria": "Analyzer-Ansicht",
        "can.translated": "Klartext",
        "can.rawData": "Rohdaten",
        "can.group.general": "Allgemein",
        "can.group.heating": "Heizung",
        "can.group.hotWater": "Warmwasser",
        "can.group.mixedCircuit": "Mischkreis",
        "can.group.controller": "Regler",
        "can.group.ta250": "TA250",
        "can.label.flameStatus": "Brennerflamme",
        "can.label.error": "Fehlercode",
        "can.label.dateTime": "Reglerzeit",
        "can.label.feedCurrent": "Vorlauf ist",
        "can.label.feedMax": "Vorlauf maximal",
        "can.label.feedSetpoint": "Vorlauf soll",
        "can.label.outsideTemperature": "Außentemperatur",
        "can.label.heatingPump": "Heizkreispumpe",
        "can.label.season": "Saisonmodus",
        "can.label.operation": "Heizbetrieb",
        "can.label.power": "Heizleistung",
        "can.label.mode": "Regelart",
        "can.label.economy": "Sparbetrieb",
        "can.label.hotWaterSetpoint": "Warmwasser soll",
        "can.label.hotWaterMax": "Warmwasser maximal",
        "can.label.hotWaterCurrent": "Warmwasser ist",
        "can.label.hotWaterNow": "Warmwasser sofort",
        "can.label.bufferOperation": "Speicherbetrieb",
        "can.label.continuousFlowSetpoint": "Durchlauf soll",
        "can.label.mixedPump": "Mischkreispumpe",
        "can.label.mixedFeedSetpoint": "Mischkreis Vorlauf soll",
        "can.label.mixedFeedCurrent": "Mischkreis Vorlauf ist",
        "can.label.mixedEconomy": "Mischkreis Sparbetrieb",
        "can.label.powerRating": "Leistungskennung",
        "can.label.ta250Heartbeat": "TA250-Lebenszeichen",
        "can.label.unknownStatus208": "Unbekanntes Statusflag",
        "can.value.weatherCompensated": "Witterungsgeführt",
        "can.value.roomControlled": "Raumgeführt",
        "can.value.winter": "Winter",
        "can.value.summer": "Sommer",
        "can.value.heartbeat": "Lebenszeichen",
        "can.value.noError": "Kein Fehler",
        "can.value.canInterrupted": "A8 - CAN-Kommunikation unterbrochen",
        "can.value.day": "Tag {day}",
        "can.value.monday": "Montag",
        "can.value.tuesday": "Dienstag",
        "can.value.wednesday": "Mittwoch",
        "can.value.thursday": "Donnerstag",
        "can.value.friday": "Freitag",
        "can.value.saturday": "Samstag",
        "can.value.sunday": "Sonntag",
        "heating.title": "Heizungsstatus",
        "heating.subtitle": "Aktive ESP-Parameter, Livewerte und berechnete Heizkurve.",
        "heating.curve": "Heizkurve",
        "heating.effectiveState": "Wirksamer Zustand",
        "heating.receivedParameters": "Empfangene Parameter",
        "heating.boilerBusCurrent": "Kessel / Bus aktuell",
        "heating.mqttConnected": "MQTT verbunden",
        "heating.mqttDisconnected": "MQTT getrennt",
        "heating.statusUnavailable": "Status nicht erreichbar",
        "heating.active": "aktiv",
        "heating.ready": "bereit",
        "heating.seasonOn": "Heizsaison an",
        "heating.seasonOff": "Heizsaison aus",
        "heating.calculatedAt": "{feed} bei {outside} außen",
        "heating.enabled": "Heizen freigegeben",
        "heating.blocked": "Heizen blockiert",
        "heating.allowed": "ESP darf nach Heizkurve senden.",
        "heating.blocked.seasonOff": "Heizsaison ist aus.",
        "heating.blocked.notRequested": "Heizkurve ist inaktiv oder die Außentemperatur liegt über der Heizgrenze.",
        "heating.requested": "Angefordert",
        "heating.seasonAllowed": "Saison erlaubt",
        "heating.feedEffective": "CAN 0x252 effektiv",
        "heating.feed": "Vorlauf",
        "heating.outside": "Außen",
        "bool.on": "Ein",
        "bool.off": "Aus"
    }
};
function getStoredLanguage() {
    const stored = localStorage.getItem(LanguageStorageKey);
    if (stored === "de" || stored === "en") return stored;
    return navigator.language && navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

function translate(key, replacements) {
    const lang = getStoredLanguage();
    let text = (CerasmarterTranslations[lang] && CerasmarterTranslations[lang][key]) || CerasmarterTranslations.en[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach((name) => {
            text = text.replace(`{${name}}`, replacements[name]);
        });
    }
    return text;
}

function translatePage() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = translate(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", translate(el.getAttribute("data-i18n-title")));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", translate(el.getAttribute("data-i18n-placeholder")));
    });
}

function setLanguage(language) {
    const lang = language === "de" ? "de" : "en";
    localStorage.setItem(LanguageStorageKey, lang);
    document.documentElement.setAttribute("lang", lang);
    const select = _("language-select");
    if (select) select.value = lang;
    translatePage();
    applyTheme(getStoredTheme());
    window.dispatchEvent(new CustomEvent("cerasmarter:language-changed", { detail: { language: lang } }));
}

function initLanguageToggle() {
    const select = _("language-select");
    const lang = getStoredLanguage();
    document.documentElement.setAttribute("lang", lang);
    if (select) {
        select.value = lang;
        select.addEventListener("change", function () { setLanguage(select.value); });
    }
    translatePage();
}

window.CerasmarterI18n = {
    t: translate,
    getLanguage: getStoredLanguage,
    setLanguage: setLanguage
};

function ensureThemeStyles() {
    if (_("cerasmarter-theme-styles")) return;
    const style = document.createElement("style");
    style.id = "cerasmarter-theme-styles";
    style.textContent = `body{transition:background-color .18s ease,color .18s ease}body.theme-light{background:#f6f8fb;color:#212529}body.theme-dark{background:#111827;color:#e5e7eb}body.theme-dark .navbar,body.theme-dark .dropdown-menu{background-color:#0b1220!important;border-color:#263244}body.theme-dark .dropdown-item,body.theme-dark .navbar-brand,body.theme-dark .nav-link{color:#e5e7eb!important}body.theme-dark .dropdown-item:hover,body.theme-dark .dropdown-item:focus{background-color:#1f2937}body.theme-dark .card,body.theme-dark .list-group-item,body.theme-dark .modal-content,body.theme-dark .border,body.theme-dark .alert-light{background-color:#172033!important;border-color:#2f3d52!important;color:#e5e7eb!important}body.theme-dark .table{color:#e5e7eb;border-color:#2f3d52}body.theme-dark .table>:not(caption)>*>*{background-color:#172033;border-color:#2f3d52;color:#e5e7eb}body.theme-dark .table-warning>*{background-color:#574111!important;color:#fff4cf!important}body.theme-dark .table-info>*{background-color:#113b54!important;color:#d7f1ff!important}body.theme-dark .bg-light,body.theme-dark .sticky-top.bg-light{background-color:#1f2937!important;color:#f3f4f6!important}body.theme-dark .form-control,body.theme-dark .form-select{background-color:#0f172a;border-color:#334155;color:#e5e7eb}body.theme-dark .text-muted,body.theme-dark .form-text{color:#a7b3c4!important}body.theme-dark code{color:#a7f3d0}.theme-toggle-label{min-width:3.2rem;color:#e5e7eb}`;
    document.head.appendChild(style);
}

function getStoredTheme() {
    const stored = localStorage.getItem(ThemeStorageKey);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
    ensureThemeStyles();
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme !== "dark");
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = _("theme-toggle");
    const label = _("theme-toggle-label");
    if (toggle) toggle.checked = theme === "dark";
    if (label) label.textContent = theme === "dark" ? translate("theme.dark") : translate("theme.light");
}

function setTheme(theme) {
    localStorage.setItem(ThemeStorageKey, theme);
    applyTheme(theme);
}

function initThemeToggle() {
    const toggle = _("theme-toggle");
    if (!toggle) return;
    toggle.checked = getStoredTheme() === "dark";
    toggle.addEventListener("change", function () { setTheme(toggle.checked ? "dark" : "light"); });
    applyTheme(getStoredTheme());
}

if (document.body) applyTheme(getStoredTheme());
const CanErrorCodes = [
    "OK",
    "No MCP2515",
    "Too Far From Desired Bit Rate",
    "Inconsistent Bit Rate Settings",
    "INT Pin Is Not An Interrupt",
    "ISR Is Null",
    "Requested Mode TimeOut",
    "Acceptance Filter Array Is NULL",
    "One Filter Mask Requires One Or Two Acceptance Filters",
    "Two Filter Masks Require Three To Six Acceptance Filters",
    "Cannot Allocate Receive Buffer",
    "Cannot Allocate Transmit Buffer 0",
    "Cannot Allocate Transmit Buffer 1",
    "Cannot Allocate Transmit Buffer 2",
    "ISR Not Null And No Int Pin",
]

function humanReadableSize(bytes) {
    if (bytes < 1024)
        return bytes + " B";
    else if (bytes < (1024 * 1024))
        return (bytes / 1024.0).toFixed(2) + " KB";
    else if (bytes < (1024 * 1024 * 1024))
        return (bytes / 1024.0 / 1024.0).toFixed(2) + " MB";
    else
        return (bytes / 1024.0 / 1024.0 / 1024.0).toFixed(2) + " GB";
}

function loadNavigation() {
    const nav = _("navigation-container");
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            nav.innerHTML = xhr.responseText;
            let curLocation = window.location.pathname
                .replace("/", "")
                .trim();
            if (curLocation.length === 0) {
                curLocation = "home";
            }
            try {
                _(curLocation + "-link").classList.add("active");
            } catch (error) {
                console.log("Missing Nav-link to activate.");
            }
            initThemeToggle();
            initLanguageToggle();
        }
    }

    xhr.open("GET", "frontend/navigation.html", true);
    xhr.setRequestHeader('Content-type', 'text/html');
    xhr.send();
}

/**
 * Gets all keys of a json object
 * 
 * @param {Object} jsonObj Input json to look through
 * @returns {Array<string>} An array of point separated keys as string
 */
function getDeepKeys(jsonObj) {
    let keys = [];
    for (var key in jsonObj) {
        if (typeof jsonObj[key] === "object" && !Array.isArray(jsonObj[key])) {
            var subkeys = getDeepKeys(jsonObj[key]);
            keys = keys.concat(subkeys.map(function (subkey) {
                return `${key}.${subkey}`;
            }));
        } else if (Array.isArray(jsonObj[key])) {
            for (var i = 0; i < jsonObj[key].length; i++) {
                var subkeys = getDeepKeys(jsonObj[key][i]);
                keys = keys.concat(subkeys.map((subkey) => `${key}[${i}].${subkey}`));
            }
        } else {
            keys.push(key);
        }
    }
    return keys;
}

/**
* Converts a string path to a value that is existing in a json object.
* 
* @param {Object} jsonObj Json to use for searching the value.
* @param {Object} path the path to use to find the value.
* @returns {valueOfThePath|null}
*/
function jsonPathToValue(jsonObj, path) {
    if (!(jsonObj instanceof Object) || typeof (path) === "undefined") {
        throw `Not valid argument:jsonData:${jsonObj}, path:${path}`;
    }
    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    path = path.replace(/^\./, ''); // strip a leading dot
    const pathArray = path.split('.');
    for (let i = 0, n = pathArray.length; i < n; ++i) {
        const key = pathArray[i];
        if (key in jsonObj) {
            if (jsonObj[key] !== null) {
                jsonObj = jsonObj[key];
            } else {
                return null;
            }
        } else {
            return key;
        }
    }
    return jsonObj;
}

/**
 * Converts a form into a nested json object. Form input fields need to have a 'name' attribute and nested values need to have a dot-separated name.
 * Example:
 * ```
 * <form>
 *  <input name="parent.subkey1"/>
 *  <input name="parent.subkey2.subkey3"/>
 * </form>
 * ```
 * @param {string} formId The Id of the form to process
 * @returns {Object} A json object containing the forms data
 */
function serializeForm(formId) {
    const elements = document.querySelectorAll(`#${formId} input`);
    const data = {};
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        var val = el.value;
        if (!val) val = "";
        const fullName = el.getAttribute("name");
        if (!fullName) continue;
        const fullNameParts = fullName.split('.');
        let prefix = '';
        let stack = data;
        for (let k = 0; k < fullNameParts.length - 1; k++) {
            prefix = fullNameParts[k];
            if (!stack[prefix]) {
                stack[prefix] = {};
            }
            stack = stack[prefix];
        }
        prefix = fullNameParts[fullNameParts.length - 1];
        if (stack[prefix]) {

            var newVal = `${stack[prefix]},${val}`;
            stack[prefix] += newVal;
        } else {
            stack[prefix] = val;
        }
    }
    return data;
}

function rebootButton() {
    _("statusdetails").innerHTML = translate("home.invokingReboot");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/reboot", true);
    xhr.send();
    window.open("/reboot", "_self");
}