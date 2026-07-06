loadNavigation();
loadKnownAddresses();
startEvents();

let messages = [];
let knownAddresses = [];
let knownAddressLabels = {};
let unknownAddresses = [];
let previousMessage = [];
let translatedDefinitions = {};
let translatedState = {};

const msgLog = _("can-msg");
const weekdayNames = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function normalizeCanId(value) {
    if (typeof value === "number") return `0x${decimalToHex(value, 3).toUpperCase()}`;
    const raw = String(value).trim().replace(/^0x/i, "");
    const parsed = parseInt(raw, 16);
    if (Number.isNaN(parsed)) return String(value).toUpperCase();
    return `0x${decimalToHex(parsed, 3).toUpperCase()}`;
}

function definitionForPath(path) {
    return canDefinitionCatalog()[path] || null;
}

function canDefinitionCatalog() {
    return {
        "Controller.FlameStatus": {group: "Allgemein", label: "Brennerflamme", decoder: decodeBool("An", "Aus")},
        "Controller.Error": {group: "Allgemein", label: "Fehlercode", decoder: decodeError},
        "Controller.DateTime": {group: "Allgemein", label: "Reglerzeit", decoder: decodeDateTime},
        "Heating.FeedCurrent": {group: "Heizung", label: "Vorlauf ist", decoder: decodeHalfStep},
        "Heating.FeedMax": {group: "Heizung", label: "Vorlauf maximal", decoder: decodeHalfStep},
        "Heating.FeedSetpoint": {group: "Heizung", label: "Vorlauf soll", decoder: decodeHalfStep},
        "Heating.OutsideTemperature": {group: "Heizung", label: "Aussentemperatur", decoder: decodeOutsideTemperature},
        "Heating.Pump": {group: "Heizung", label: "Heizkreispumpe", decoder: decodeBool("An", "Aus")},
        "Heating.Season": {group: "Heizung", label: "Saisonmodus", decoder: decodeBool("Winter", "Sommer")},
        "Heating.Operation": {group: "Heizung", label: "Heizbetrieb", decoder: decodeBool("An", "Aus")},
        "Heating.Power": {group: "Heizung", label: "Heizleistung", decoder: decodePower},
        "Heating.Mode": {group: "Heizung", label: "Regelart", decoder: decodeBool("Witterungsgefuehrt", "Raumgefuehrt")},
        "Heating.Economy": {group: "Heizung", label: "Sparbetrieb", decoder: decodeBool("An", "Aus")},
        "HotWater.SetpointTemperature": {group: "Warmwasser", label: "Warmwasser soll", decoder: decodeHalfStep},
        "HotWater.MaxTemperature": {group: "Warmwasser", label: "Warmwasser maximal", decoder: decodeHalfStep},
        "HotWater.CurrentTemperature": {group: "Warmwasser", label: "Warmwasser ist", decoder: decodeHalfStep},
        "HotWater.Now": {group: "Warmwasser", label: "Warmwasser sofort", decoder: decodeBool("An", "Aus")},
        "HotWater.BufferOperation": {group: "Warmwasser", label: "Speicherbetrieb", decoder: decodeBool("An", "Aus")},
        "HotWater.ContinousFlow.SetpointTemperature": {group: "Warmwasser", label: "Durchlauf soll", decoder: decodeHalfStep},
        "MixedCircuit.Pump": {group: "Mischkreis", label: "Mischkreispumpe", decoder: decodeBool("An", "Aus")},
        "MixedCircuit.FeedSetpoint": {group: "Mischkreis", label: "Mischkreis Vorlauf soll", decoder: decodeHalfStep},
        "MixedCircuit.FeedCurrent": {group: "Mischkreis", label: "Mischkreis Vorlauf ist", decoder: decodeHalfStep},
        "MixedCircuit.Economy": {group: "Mischkreis", label: "Mischkreis Sparbetrieb", decoder: decodeBool("An", "Aus")}
    };
}

async function loadKnownAddresses() {
    const addresses = await getConfigJson("/api/config/canbus");
    translatedDefinitions = buildCanDefinitions(addresses);
    const keys = getDeepKeys(addresses).filter(e => e !== "quartz");
    keys.forEach(e => {
        let value = jsonPathToValue(addresses, e);
        if (!value || typeof value !== "string" || !value.toLowerCase().startsWith("0x")) return;
        const normalizedValue = normalizeCanId(value);
        knownAddresses.push(normalizedValue);
        knownAddressLabels[normalizedValue] = definitionForPath(e)?.label || e;
    });
    knownAddresses = [...new Set(knownAddresses.map(e => normalizeCanId(e)))].sort();
    Object.keys(fixedCanDefinitions()).forEach(id => { const normalizedId = normalizeCanId(id); if (!knownAddresses.includes(normalizedId)) knownAddresses.push(normalizedId); knownAddressLabels[normalizedId] = fixedCanDefinitions()[id].label; });
    knownAddresses.sort();
    knownAddresses.forEach((e) => {
        const label = knownAddressLabels[e] || e;
        _("known-addresses").innerHTML += `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="${e.toLowerCase()}-enabled" checked><label class="form-check-label" for="${e.toLowerCase()}-enabled"><code>${e}</code> ${label}</label></div>`;
    });
    renderTranslatedParameters();
}

function fixedCanDefinitions() {
    return {
        "0x20D": {group: "Controller", label: "Leistungskennung", decoder: decodeKilowatt, path: "Fixed.PowerRating"},
        "0x0F9": {group: "TA250", label: "Bedienteil-Heartbeat", decoder: decodeHeartbeat, path: "Fixed.Ta250Heartbeat"},
        "0x208": {group: "Controller", label: "Statusflag unbekannt", decoder: decodeUnknownFlag, path: "Fixed.UnknownStatus208"}
    };
}

function buildCanDefinitions(addresses) {
    const result = {};
    const definitions = canDefinitionCatalog();
    Object.keys(definitions).forEach(path => {
        const id = jsonPathToValue(addresses, path);
        if (!id || typeof id !== "string" || !id.toLowerCase().startsWith("0x")) return;
        const normalizedId = normalizeCanId(id);
        result[normalizedId] = {...definitions[path], path, id: normalizedId};
    });
    const fixedDefinitions = fixedCanDefinitions();
    Object.keys(fixedDefinitions).forEach(id => {
        const normalizedId = normalizeCanId(id);
        result[normalizedId] = {...fixedDefinitions[id], id: normalizedId};
    });
    return result;
}
function formatRawBytes(data) {
    return data.map(e => `0x${decimalToHex(e, 2).toUpperCase()} (${e})`).join(" ");
}

function firstByte(data) {
    return data.length ? Number(data[0]) : 0;
}

function decodeBool(onText, offText) {
    return function (data) { return firstByte(data) ? onText : offText; }
}

function decodeHalfStep(data) {
    return `${(firstByte(data) / 2).toFixed(1)} &deg;C`;
}

function decodePower(data) {
    return `${Math.round(firstByte(data) * 100 / 255)} %`;
}


function decodeKilowatt(data) {
    if (!data.length) return "--";
    return `${firstByte(data)} kW`;
}

function decodeHeartbeat(data) {
    return data.length === 0 ? "Lebenszeichen" : formatRawBytes(data);
}

function decodeUnknownFlag(data) {
    if (!data.length) return "--";
    return firstByte(data) ? `Aktiv / raw ${firstByte(data)}` : "Aus / raw 0";
}
function decodeOutsideTemperature(data) {
    if (data.length < 2) return "--";
    let raw = (data[0] << 8) | data[1];
    if (raw & 0x8000) raw = raw - 0x10000;
    return `${(raw / 100).toFixed(2)} &deg;C`;
}

function decodeDateTime(data) {
    if (data.length < 3) return "--";
    const weekday = weekdayNames[data[0]] || `Tag ${data[0]}`;
    return `${weekday}, ${String(data[1]).padStart(2, "0")}:${String(data[2]).padStart(2, "0")}`;
}

function decodeError(data) {
    const value = firstByte(data);
    if (value === 0) return "Kein Fehler";
    if (value === 0xA8 || value === 168) return "A8 - CAN-Kommunikation unterbrochen";
    return `0x${decimalToHex(value, 2).toUpperCase()} (${value})`;
}

function updateTranslatedMessage(json, msgId) {
    const id = normalizeCanId(`0x${msgId}`);
    const definition = translatedDefinitions[id];
    if (!definition) return;
    let value = "--";
    try {
        value = definition.decoder(json.data);
    } catch (error) {
        value = "Decode error";
        console.error(`Error decoding ${id}: ${error}`);
    }
    translatedState[id] = {...definition, value, raw: formatRawBytes(json.data), direction: json.rcv ? "Empfangen" : "Gesendet", timestamp: new Date().toLocaleTimeString()};
    renderTranslatedParameters(id);
}

function renderTranslatedParameters(updatedId) {
    const target = _("translated-parameters");
    if (!target) return;
    const definitions = Object.values(translatedDefinitions).sort((a, b) => `${a.group} ${a.label}`.localeCompare(`${b.group} ${b.label}`));
    target.innerHTML = definitions.map(def => {
        const state = translatedState[def.id] || {};
        const updatedClass = updatedId === def.id ? " updated" : "";
        return `<div class="parameter-card${updatedClass}" id="param-${def.id.replace("0x", "")}"><div class="d-flex justify-content-between align-items-start gap-2"><div><div class="text-muted small">${def.group}</div><div class="fw-semibold">${def.label}</div></div><code>${def.id}</code></div><div class="parameter-value mt-2">${state.value || "--"}</div><div class="small text-muted mt-2">${state.direction || "Noch kein Frame"}${state.timestamp ? " um " + state.timestamp : ""}</div><div class="small mt-1"><code>${state.raw || ""}</code></div></div>`;
    }).join("");
}

function canIdKnown(id) {
    const normalizedId = normalizeCanId(id);
    return knownAddresses.some((x) => normalizeCanId(x) === normalizedId);
}

function canIdIsInUnknown(id) {
    const normalizedId = normalizeCanId(id);
    return unknownAddresses.some((x) => normalizeCanId(x) === normalizedId);
}

function onSwitchAllAddresses() {
    knownAddresses.forEach((e) => {
        const sw = _(`${e.toLowerCase()}-enabled`);
        if (sw) sw.checked = !_("ignoreKnown").checked;
    });
}
function addToKnownAddress(id) {
    const msgId = `0x${id.toUpperCase()}`;
    const found = unknownAddresses.findIndex((e) => e === msgId);
    if (found > -1) unknownAddresses.splice(found, 1);
    const unknown = _(`${id.toLowerCase()}-unknown`);
    if (unknown) unknown.remove();
    knownAddresses.push(`0x${id}`);
    _("known-addresses").innerHTML += `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="0x${id.toLowerCase()}-enabled" checked><label class="form-check-label" for="0x${id.toLowerCase()}-enabled"><code>${msgId}</code></label></div>`;
}

function addUnknownAddress(id) {
    const msgId = `0x${id.toUpperCase()}`;
    const found = knownAddresses.findIndex((e) => e === msgId);
    if (found > -1) {
        knownAddresses.splice(found, 1);
        const known = _(`${id.toLowerCase()}-enabled`);
        if (known) known.closest(".form-check")?.remove();
    }
    unknownAddresses.push(`0x${id.toUpperCase()}`);
    _("unknown-addresses").innerHTML += `<div class="mb-3" id="${id.toLowerCase()}-unknown"><button type="button" class="btn btn-primary btn-sm" onClick="addToKnownAddress('${id}')">+</button> <code>0x${id.toUpperCase()}</code></div>`;
}

function checkPreviousMessage(message) {
    if (previousMessage.some((x) => x.id === message.id)) {
        const found = previousMessage.findIndex((i) => i.id === message.id);
        const prevMsgCopy = previousMessage[found];
        previousMessage[found] = message;
        return prevMsgCopy;
    }
    previousMessage.push(message);
    return message;
}

function compareValues(a, b) {
    let resultArr = [];
    const biggerArr = a.length >= b.length ? a : b;
    for (let i = 0; i < biggerArr.length; i++) resultArr.push((b[i] || 0) - (a[i] || 0));
    return resultArr;
}

function addMessage(message) {
    let json = JSON.parse(message);
    let msgId = decimalToHex(json.id, 3);
    updateTranslatedMessage(json, msgId);

    if (_("ignoreKnown").checked && canIdKnown(`0x${msgId}`)) return;
    if (canIdKnown(`0x${msgId}`)) {
        const msgSwitch = _(`0x${msgId.toLowerCase()}-enabled`);
        if (msgSwitch && !msgSwitch.checked) return;
    } else if (!canIdIsInUnknown(`0x${msgId}`)) {
        addUnknownAddress(msgId);
    }

    messages.push(json);
    const prevMsg = checkPreviousMessage(json);
    const diffInValues = compareValues(prevMsg.data, json.data);
    const hasDifferentValues = diffInValues.some((x) => x !== 0);
    let msgData = "";
    try {
        json.data.forEach(e => { msgData += `<td><code>0x${decimalToHex(e, 2).toUpperCase()}(${e})</code></td>`; });
        _("can-msg").innerHTML += `<tr ${hasDifferentValues ? "class=\"table-warning\"" : ""}><td>${json.rcv ? "&#11176;" : "&#11179;"}</td><td>${canIdKnown(`0x${msgId}`) ? "" : "*"}<code>0x${msgId.toUpperCase()}</code></td>${msgData}</tr>`;
        if (hasDifferentValues) {
            let diffMsg = "";
            diffInValues.forEach((d) => { diffMsg += `<td><code>${d === 0 ? "" : (d > 0 ? "+" : "") + d + "(dec)"}</code></td>`; });
            _("can-msg").innerHTML += `<tr class="table-info"><td colspan="2">&Delta;</td>${diffMsg}</tr>`;
        }
    } catch (error) {
        console.error(`Error displaying message with id 0x${msgId}: ${error}`);
    }
    if (msgLog.lastElementChild && !_("raw-view").classList.contains("d-none")) msgLog.lastElementChild.scrollIntoView({behavior: "smooth"});
}

function decimalToHex(d, padding) {
    let hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? 2 : padding;
    while (hex.length < padding) hex = "0" + hex;
    return hex;
}

function startEvents() {
    const es = new EventSource("/events");
    es.addEventListener("can", function (e) { addMessage(e.data); }, false);
}

function switchAnalyzerView() {
    const translatedActive = _("view-translated").checked;
    _("translated-view").classList.toggle("d-none", !translatedActive);
    _("raw-view").classList.toggle("d-none", translatedActive);
}

_("view-translated").addEventListener("change", switchAnalyzerView);
_("view-raw").addEventListener("change", switchAnalyzerView);
_("ignoreKnown").addEventListener("change", onSwitchAllAddresses);