const heatingLabelSets = {
    en: {
        active: "Heating request active",
        feedSetpoint: "Fixed MQTT setpoint",
        calculatedFeedSetpoint: "Flow calculated",
        minimumFeedTemperature: "Flow minimum",
        basepointTemperature: "Design outside",
        endpointTemperature: "Heating limit",
        auxiliaryTemperature: "Outside reference MQTT",
        ambientTemperature: "Room current",
        targetAmbientTemperature: "Room target",
        feedAdaption: "Level / adaption",
        overrideSetpoint: "Use fixed setpoint",
        dynamicAdaption: "Dynamic adaption",
        valveScaling: "Valve scaling",
        maxValveOpening: "Valve max",
        valveOpening: "Valve current",
        boost: "Boost",
        boostTimeLeft: "Boost time left",
        fastHeatup: "Fast heatup",
    },
    de: {
        active: "Heizwunsch aktiv",
        feedSetpoint: "Fixer MQTT-Sollwert",
        calculatedFeedSetpoint: "Vorlauf berechnet",
        minimumFeedTemperature: "Vorlauf Minimum",
        basepointTemperature: "Auslegung außen",
        endpointTemperature: "Heizgrenze",
        auxiliaryTemperature: "Außenreferenz MQTT",
        ambientTemperature: "Raum Ist",
        targetAmbientTemperature: "Raum Ziel",
        feedAdaption: "Niveau / Anpassung",
        overrideSetpoint: "Fixen Sollwert nutzen",
        dynamicAdaption: "Dynamische Anpassung",
        valveScaling: "Ventilskalierung",
        maxValveOpening: "Ventil Max",
        valveOpening: "Ventil aktuell",
        boost: "Boost",
        boostTimeLeft: "Boost Restzeit",
        fastHeatup: "Schnellaufheizung",
    }
};

const currentLabelSets = {
    en: {
        outsideTemperature: "Outside temperature bus",
        season: "Heating season bus",
        working: "Heating operation bus",
        pump: "Pump",
        feedMaximum: "Flow maximum",
        feedCurrent: "Flow current",
        feedSetpointEffective: "Flow setpoint effective",
        feedSetpointBus: "Flow setpoint received",
        feedMinimum: "Flow minimum bus",
        heatingPower: "Power",
        flame: "Burner",
        error: "Error code",
    },
    de: {
        outsideTemperature: "Außentemperatur Bus",
        season: "Heizsaison Bus",
        working: "Heizbetrieb Bus",
        pump: "Pumpe",
        feedMaximum: "Vorlauf Maximum",
        feedCurrent: "Vorlauf Ist",
        feedSetpointEffective: "Vorlauf Soll effektiv",
        feedSetpointBus: "Vorlauf Soll empfangen",
        feedMinimum: "Vorlauf Minimum Bus",
        heatingPower: "Leistung",
        flame: "Brenner",
        error: "Fehlercode",
    }
};

function lang() {
    return window.CerasmarterI18n ? window.CerasmarterI18n.getLanguage() : "en";
}

function tr(key, replacements) {
    return window.CerasmarterI18n ? window.CerasmarterI18n.t(key, replacements) : key;
}

function labels(source) {
    return source[lang()] || source.en;
}

function boolText(value) {
    return value ? tr("bool.on") : tr("bool.off");
}

function fmt(value, suffix = "") {
    if (typeof value === "boolean") return boolText(value);
    if (typeof value === "number") return `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })}${suffix}`;
    if (value === null || value === undefined || value === "") return "--";
    return String(value);
}

function row(label, value, suffix = "") {
    return `<tr><th class="ps-3 text-muted fw-normal">${label}</th><td class="pe-3 text-end fw-semibold">${fmt(value, suffix)}</td></tr>`;
}

function renderTable(target, values, tableLabels, tempKeys = []) {
    const body = _(target);
    body.innerHTML = Object.keys(tableLabels).map((key) => {
        const suffix = tempKeys.includes(key) ? " °C" : "";
        return row(tableLabels[key], values ? values[key] : undefined, suffix);
    }).join("");
}

function calculateCurvePoint(outside, command, current) {
    const heatLimit = Number(command.endpointTemperature ?? 18);
    const designOutside = Number(command.basepointTemperature ?? -10);
    const feedMin = Number(command.minimumFeedTemperature ?? current.feedMinimum ?? 25);
    const feedDesign = Number(current.feedMaximum ?? 55);
    const level = Number(command.feedAdaption ?? 0);

    if (outside >= heatLimit || heatLimit === designOutside) return feedMin;
    const ratio = (heatLimit - outside) / (heatLimit - designOutside);
    const raw = feedMin + ratio * (feedDesign - feedMin) + level;
    return Math.min(feedDesign, Math.max(feedMin, raw));
}

function renderCurve(data) {
    const command = data.command || {};
    const current = data.current || {};
    const xs = [-15, -10, -5, 0, 5, 10, 15, 18];
    const vals = xs.map((x) => calculateCurvePoint(x, command, current));
    const yMin = Math.min(20, Math.floor(Math.min(...vals) / 5) * 5);
    const yMax = Math.max(60, Math.ceil(Math.max(...vals) / 5) * 5);
    const left = 44, right = 330, top = 26, bottom = 178;
    const xPx = (x) => left + ((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * (right - left);
    const yPx = (y) => bottom - ((y - yMin) / (yMax - yMin || 1)) * (bottom - top);
    const points = xs.map((x, i) => `${xPx(x).toFixed(1)},${yPx(vals[i]).toFixed(1)}`).join(" ");
    const outside = Number(current.outsideTemperature);
    const calculated = Number(command.calculatedFeedSetpoint);
    const hasNow = Number.isFinite(outside) && Number.isFinite(calculated);
    const nowX = hasNow ? xPx(Math.max(xs[0], Math.min(xs[xs.length - 1], outside))) : 0;
    const nowY = hasNow ? yPx(calculated) : 0;

    _("curve-summary").textContent = tr("heating.calculatedAt", {
        feed: fmt(command.calculatedFeedSetpoint, " °C"),
        outside: fmt(current.outsideTemperature, " °C")
    });
    _("curve-chart").innerHTML = `
        <svg viewBox="0 0 365 220" class="w-100" role="img" aria-label="${tr("heating.curve")}">
            <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="axis" />
            <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" class="axis" />
            ${[yMin, (yMin + yMax) / 2, yMax].map((y) => `<line x1="${left}" y1="${yPx(y).toFixed(1)}" x2="${right}" y2="${yPx(y).toFixed(1)}" class="grid" /><text x="10" y="${(yPx(y) + 4).toFixed(1)}" class="tick">${fmt(y, " °C")}</text>`).join("")}
            <polyline points="${points}" class="curve" />
            ${xs.map((x, i) => `<circle cx="${xPx(x).toFixed(1)}" cy="${yPx(vals[i]).toFixed(1)}" r="4" class="dot" /><text x="${xPx(x).toFixed(1)}" y="202" text-anchor="middle" class="tick">${x}</text>`).join("")}
            ${hasNow ? `<line x1="${nowX.toFixed(1)}" y1="${top}" x2="${nowX.toFixed(1)}" y2="${bottom}" class="now-line" /><circle cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="6" class="now-dot" />` : ""}
            <text x="${left}" y="17" class="label">${tr("heating.feed")}</text>
            <text x="${right}" y="216" text-anchor="end" class="label">${tr("heating.outside")}</text>
        </svg>
        <style>.axis{stroke:currentColor;opacity:.45}.grid{stroke:currentColor;opacity:.18}.curve{fill:none;stroke:#0d6efd;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.dot{fill:#0d6efd}.now-line{stroke:#ffc107;stroke-width:2;stroke-dasharray:5 5}.now-dot{fill:#ffc107;stroke:var(--bs-body-bg,#fff);stroke-width:2}.tick,.label{fill:currentColor;font-size:11px;opacity:.7}</style>`;
    _("curve-points").innerHTML = xs.map((x, i) => `<div class="col-6 col-md-3"><div class="border rounded px-2 py-1 small d-flex justify-content-between"><span>${x} °C</span><strong>${fmt(vals[i], " °C")}</strong></div></div>`).join("");
}

function renderEffective(data) {
    const effective = data.effective || {};
    const badge = effective.canHeat ? "text-bg-success" : "text-bg-warning";
    _("effective-state").innerHTML = `
        <div class="alert ${effective.canHeat ? "alert-success" : "alert-warning"} mb-2">
            <div class="fw-semibold">${effective.canHeat ? tr("heating.enabled") : tr("heating.blocked")}</div>
            <div>${effective.blockedReasonCode ? tr(`heating.blocked.${effective.blockedReasonCode}`) : (effective.blockedReason || tr("heating.allowed"))}</div>
        </div>
        <span class="badge ${badge}">${tr("heating.feedEffective")}: ${fmt(effective.feedSetpoint, " °C")} / ${tr("common.raw")} ${fmt(effective.feedRaw)}</span>
        <div class="small text-muted mt-2">${tr("heating.requested")}: ${boolText(effective.requested)} · ${tr("heating.seasonAllowed")}: ${boolText(effective.allowedBySeason)}</div>`;
}

async function loadHeatingStatus() {
    try {
        const response = await fetch("/api/heating/status", { cache: "no-store" });
        const data = await response.json();
        _("mqtt-state").className = `badge rounded-pill ${data.mqttConnected ? "text-bg-success" : "text-bg-danger"}`;
        _("mqtt-state").textContent = data.mqttConnected ? tr("heating.mqttConnected") : tr("heating.mqttDisconnected");
        renderCurve(data);
        renderEffective(data);
        renderTable("command-table", data.command, labels(heatingLabelSets), ["feedSetpoint", "calculatedFeedSetpoint", "minimumFeedTemperature", "basepointTemperature", "endpointTemperature", "auxiliaryTemperature", "ambientTemperature", "targetAmbientTemperature", "feedAdaption"]);
        renderTable("current-table", data.current, labels(currentLabelSets), ["outsideTemperature", "feedMaximum", "feedCurrent", "feedSetpointEffective", "feedSetpointBus", "feedMinimum"]);
    } catch (error) {
        _("mqtt-state").className = "badge rounded-pill text-bg-danger";
        _("mqtt-state").textContent = tr("heating.statusUnavailable");
        console.error(error);
    }
}

window.addEventListener("load", () => {
    loadHeatingStatus();
    setInterval(loadHeatingStatus, 3000);
});
window.addEventListener("cerasmarter:language-changed", loadHeatingStatus);