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
const weekdayKeys = ["", "can.value.monday", "can.value.tuesday", "can.value.wednesday", "can.value.thursday", "can.value.friday", "can.value.saturday", "can.value.sunday"];

function tr(key, replacements) {
    return window.CerasmarterI18n ? window.CerasmarterI18n.t(key, replacements) : key;
}

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
        "Controller.FlameStatus": {groupKey: "can.group.general", labelKey: "can.label.flameStatus", decoder: decodeBool("common.on", "common.off")},
        "Controller.Error": {groupKey: "can.group.general", labelKey: "can.label.error", decoder: decodeError},
        "Controller.DateTime": {groupKey: "can.group.general", labelKey: "can.label.dateTime", decoder: decodeDateTime},
        "Heating.FeedCurrent": {groupKey: "can.group.heating", labelKey: "can.label.feedCurrent", decoder: decodeHalfStep},
        "Heating.FeedMax": {groupKey: "can.group.heating", labelKey: "can.label.feedMax", decoder: decodeHalfStep},
        "Heating.FeedSetpoint": {groupKey: "can.group.heating", labelKey: "can.label.feedSetpoint", decoder: decodeHalfStep},
        "Heating.OutsideTemperature": {groupKey: "can.group.heating", labelKey: "can.label.outsideTemperature", decoder: decodeOutsideTemperature},
        "Heating.Pump": {groupKey: "can.group.heating", labelKey: "can.label.heatingPump", decoder: decodeBool("common.on", "common.off")},
        "Heating.Season": {groupKey: "can.group.heating", labelKey: "can.label.season", decoder: decodeBool("can.value.winter", "can.value.summer")},
        "Heating.Operation": {groupKey: "can.group.heating", labelKey: "can.label.operation", decoder: decodeBool("common.on", "common.off")},
        "Heating.Power": {groupKey: "can.group.heating", labelKey: "can.label.power", decoder: decodePower},
        "Heating.Mode": {groupKey: "can.group.heating", labelKey: "can.label.mode", decoder: decodeBool("can.value.weatherCompensated", "can.value.roomControlled")},
        "Heating.Economy": {groupKey: "can.group.heating", labelKey: "can.label.economy", decoder: decodeBool("common.on", "common.off")},
        "HotWater.SetpointTemperature": {groupKey: "can.group.hotWater", labelKey: "can.label.hotWaterSetpoint", decoder: decodeHalfStep},
        "HotWater.MaxTemperature": {groupKey: "can.group.hotWater", labelKey: "can.label.hotWaterMax", decoder: decodeHalfStep},
        "HotWater.CurrentTemperature": {groupKey: "can.group.hotWater", labelKey: "can.label.hotWaterCurrent", decoder: decodeHalfStep},
        "HotWater.Now": {groupKey: "can.group.hotWater", labelKey: "can.label.hotWaterNow", decoder: decodeBool("common.on", "common.off")},
        "HotWater.BufferOperation": {groupKey: "can.group.hotWater", labelKey: "can.label.bufferOperation", decoder: decodeBool("common.on", "common.off")},
        "HotWater.ContinousFlow.SetpointTemperature": {groupKey: "can.group.hotWater", labelKey: "can.label.continuousFlowSetpoint", decoder: decodeHalfStep},
        "MixedCircuit.Pump": {groupKey: "can.group.mixedCircuit", labelKey: "can.label.mixedPump", decoder: decodeBool("common.on", "common.off")},
        "MixedCircuit.FeedSetpoint": {groupKey: "can.group.mixedCircuit", labelKey: "can.label.mixedFeedSetpoint", decoder: decodeHalfStep},
        "MixedCircuit.FeedCurrent": {groupKey: "can.group.mixedCircuit", labelKey: "can.label.mixedFeedCurrent", decoder: decodeHalfStep},
        "MixedCircuit.Economy": {groupKey: "can.group.mixedCircuit", labelKey: "can.label.mixedEconomy", decoder: decodeBool("common.on", "common.off")}
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
        const definition = definitionForPath(e);
        knownAddressLabels[normalizedValue] = definition ? definition.labelKey : e;
    });
    knownAddresses = [...new Set(knownAddresses.map(e => normalizeCanId(e)))].sort();
    Object.keys(fixedCanDefinitions()).forEach(id => {
        const normalizedId = normalizeCanId(id);
        if (!knownAddresses.includes(normalizedId)) knownAddresses.push(normalizedId);
        knownAddressLabels[normalizedId] = fixedCanDefinitions()[id].labelKey;
    });
    knownAddresses.sort();
    renderKnownAddresses();
    renderTranslatedParameters();
}

function renderKnownAddresses() {
    _("known-addresses").innerHTML = knownAddresses.map((e) => {
        const label = knownAddressLabels[e] ? tr(knownAddressLabels[e]) : e;
        return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="${e.toLowerCase()}-enabled" checked><label class="form-check-label" for="${e.toLowerCase()}-enabled"><code>${e}</code> ${label}</label></div>`;
    }).join("");
}

function fixedCanDefinitions() {
    return {
        "0x20D": {groupKey: "can.group.controller", labelKey: "can.label.powerRating", decoder: decodeKilowatt, path: "Fixed.PowerRating"},
        "0x0F9": {groupKey: "can.group.ta250", labelKey: "can.label.ta250Heartbeat", decoder: decodeHeartbeat, path: "Fixed.Ta250Heartbeat"},
        "0x208": {groupKey: "can.group.controller", labelKey: "can.label.unknownStatus208", decoder: decodeUnknownFlag, path: "Fixed.UnknownStatus208"}
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

function decodeBool(onKey, offKey) {
    return function (data) { return firstByte(data) ? tr(onKey) : tr(offKey); }
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
    return data.length === 0 ? tr("can.value.heartbeat") : formatRawBytes(data);
}

function decodeUnknownFlag(data) {
    const raw = firstByte(data);
    if (!data.length) return "--";
    return raw ? `${tr("common.active")} / ${tr("common.raw")} ${raw}` : `${tr("common.off")} / ${tr("common.raw")} 0`;
}

function decodeOutsideTemperature(data) {
    if (data.length < 2) return "--";
    let raw = (data[0] << 8) | data[1];
    if (raw & 0x8000) raw = raw - 0x10000;
    return `${(raw / 100).toFixed(2)} &deg;C`;
}

function decodeDateTime(data) {
    if (data.length < 3) return "--";
    const weekday = weekdayKeys[data[0]] ? tr(weekdayKeys[data[0]]) : tr("can.value.day", {day: data[0]});
    return `${weekday}, ${String(data[1]).padStart(2, "0")}:${String(data[2]).padStart(2, "0")}`;
}

function decodeError(data) {
    const value = firstByte(data);
    if (value === 0) return tr("can.value.noError");
    if (value === 0xA8 || value === 168) return tr("can.value.canInterrupted");
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
        value = tr("common.decodeError");
        console.error(`Error decoding ${id}: ${error}`);
    }
    translatedState[id] = {...definition, value, raw: formatRawBytes(json.data), rcv: json.rcv, timestamp: new Date().toLocaleTimeString()};
    renderTranslatedParameters(id);
}

function renderTranslatedParameters(updatedId) {
    const target = _("translated-parameters");
    if (!target) return;
    const definitions = Object.values(translatedDefinitions).sort((a, b) => `${tr(a.groupKey)} ${tr(a.labelKey)}`.localeCompare(`${tr(b.groupKey)} ${tr(b.labelKey)}`));
    target.innerHTML = definitions.map(def => {
        const state = translatedState[def.id] || {};
        const updatedClass = updatedId === def.id ? " updated" : "";
        const direction = state.timestamp ? (state.rcv ? tr("common.received") : tr("common.sent")) : tr("common.noFrame");
        const timestamp = state.timestamp ? ` ${tr("common.at")} ${state.timestamp}` : "";
        return `<div class="parameter-card${updatedClass}" id="param-${def.id.replace("0x", "")}"><div class="d-flex justify-content-between align-items-start gap-2"><div><div class="text-muted small">${tr(def.groupKey)}</div><div class="fw-semibold">${tr(def.labelKey)}</div></div><code>${def.id}</code></div><div class="parameter-value mt-2">${state.value || "--"}</div><div class="small text-muted mt-2">${direction}${timestamp}</div><div class="small mt-1"><code>${state.raw || ""}</code></div></div>`;
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
window.addEventListener("cerasmarter:language-changed", () => {
    Object.keys(translatedState).forEach((id) => {
        const state = translatedState[id];
        const rawBytes = state.raw ? state.raw.match(/\((\d+)\)/g) : null;
        if (!rawBytes || !translatedDefinitions[id]) return;
        const data = rawBytes.map((entry) => Number(entry.replace(/[()]/g, "")));
        state.value = translatedDefinitions[id].decoder(data);
    });
    renderKnownAddresses();
    renderTranslatedParameters();
});